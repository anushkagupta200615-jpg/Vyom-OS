import os
import random
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
import numpy as np
import warnings

warnings.filterwarnings('ignore')

app = FastAPI(title="Vyom OS Ground Station API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Initializing Vector Database...")
chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection(name="research_papers")

HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {}

def get_embedding(text: str) -> list[float]:
    api_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
    try:
        response = httpx.post(api_url, headers=HEADERS, json={"inputs": text}, timeout=10.0)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Embedding API Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Embedding request failed: {e}")
    # Fallback to a zero vector to prevent crashing
    return [0.0] * 384

def generate_text(prompt: str) -> str:
    api_url = "https://api-inference.huggingface.co/models/google/flan-t5-small"
    try:
        response = httpx.post(api_url, headers=HEADERS, json={"inputs": prompt, "parameters": {"max_length": 150}}, timeout=15.0)
        if response.status_code == 200:
            return response.json()[0].get("generated_text", "Failed to parse API response.")
        else:
            return f"API Error: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Local Generation Error: Failed to reach Hugging Face API ({e})."

print("Ingesting knowledge base...")
try:
    with open("mock_research_papers.txt", "r") as f:
        content = f.read()
        papers = content.split("\n\nTitle:")
        for i, p in enumerate(papers):
            doc = p if i == 0 else "Title:" + p
            emb = get_embedding(doc)
            collection.upsert(
                documents=[doc],
                embeddings=[emb],
                metadatas=[{"source": "isro_database"}],
                ids=[f"doc_{i}"]
            )
except FileNotFoundError:
    print("Warning: mock_research_papers.txt not found.")

class AnomalyReport(BaseModel):
    id: str
    type: str
    location: dict
    severity: float
    confidence: float
    timestamp: str

@app.get("/")
def read_root():
    return {"status": "Vyom OS Ground Station Online"}

@app.post("/api/edge/transmit")
def receive_edge_data(report: AnomalyReport):
    print(f"Received anomaly from Edge: {report.type} at {report.location}")
    
    # 1. Predictive ML model logic
    spread_prediction = []
    base_spread = report.severity * 2.5
    for day in range(1, 4):
        # Logistic-like growth for severity spread
        growth_factor = 1 + np.log(day + 1)
        spread_prediction.append({"day": day, "spread_radius_km": round(base_spread * growth_factor, 2)})

    # 2. RAG Retrieval
    query_emb = get_embedding(report.type)
    results = collection.query(
        query_embeddings=[query_emb],
        n_results=1
    )
    context = results['documents'][0][0] if results['documents'] else "No context found."

    # 3. LLM Generation
    prompt = f"Context: {context[:400]}\nQuestion: Based on this, provide a concise mitigation strategy for a {report.type} anomaly."
    
    try:
        llm_output = generate_text(prompt)
    except Exception as e:
        llm_output = f"Local AI Generation Error: {e}"

    generated_report = f"""
[AUTONOMOUS AI REPORT]
Target: {report.type}
Confidence: {report.confidence*100}%

Local LLM Output (FLAN-T5):
{llm_output}
    """

    return {
        "status": "success",
        "received_data": report,
        "prediction": spread_prediction,
        "rag_context_used": context,
        "generated_report": generated_report.strip()
    }

@app.get("/api/dashboard/status")
def get_dashboard_status():
    return {
        "active_satellites": 18,
        "anomalies_detected": random.randint(1, 5),
        "bandwidth_saved_mb": round(random.uniform(500, 1500), 2),
        "system_health": "Optimal"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
