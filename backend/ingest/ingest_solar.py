import httpx
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

def ingest_data():
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)
    
    docs = []
    
    # 1. NASA DONKI API
    print("Fetching NASA DONKI data...")
    donki_url = "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?startDate=2023-01-01&endDate=2025-01-01"
    try:
        events = httpx.get(donki_url, timeout=30.0).json()
        for e in events:
            text = f"Solar Flare on {e.get('beginTime')}. Class: {e.get('classType')}."
            text += f" Peak time: {e.get('peakTime')}. Source: {e.get('sourceLocation')}."
            if e.get("linkedEvents"):
                text += f" Linked to: {[l.get('activityID', '') for l in e.get('linkedEvents', [])]}."
            docs.append(Document(page_content=text,
                                 metadata={"source":"NASA_DONKI", "class":e.get('classType', '')}))
    except Exception as e:
        print(f"Error fetching DONKI: {e}")

    # 2. NOAA SWPC
    print("Fetching SWPC Discussion...")
    swpc_url = "https://services.swpc.noaa.gov/text/discussion.txt"
    try:
        text = httpx.get(swpc_url, timeout=30.0).text
        paragraphs = text.split("\n\n")
        for p in paragraphs:
            if p.strip():
                docs.append(Document(page_content=p.strip(), metadata={"source": "SWPC_BULLETIN"}))
    except Exception as e:
        print(f"Error fetching SWPC: {e}")

    # 3. ISRO Procedures
    print("Generating ISRO Procedures...")
    isro_procs = [
        "ISRO Mission Control Procedure: During an X-class solar flare, all Earth Observation satellites including Cartosat-3 must enter safe-mode immediately to prevent sensor damage.",
        "ISRO Protocol: NavIC (IRNSS) satellites may experience signal degradation during M-class flares. Mission control should alert users of potential positioning errors.",
        "ISRO Safe-Mode: Chandrayaan-2 orbiter operations must be suspended and solar panels oriented away from direct solar radiation during major coronal mass ejections.",
        "ISRO Comm Protocol: In the event of a communication blackout caused by solar radiation storms, ground stations should switch to low-frequency fallback channels.",
        "Cartosat Imaging Schedule: Cancel all high-resolution imaging tasks if solar X-ray flux exceeds 1e-4 W/m2 (M-class).",
        "ISRO Safe-Mode: RISAT-2BR1 radar operations must be temporarily disabled during extreme solar proton events.",
        "ISRO Procedure: GSAT communication satellites must switch to redundant systems if radiation anomaly is detected.",
        "ISRO Alert: If Aditya-L1 SoLEXS reports an X-class flare, trigger the highest alert level for all LEO satellites.",
        "ISRO Protocol: For C-class flares, monitor LEO satellites closely but normal operations can continue.",
        "ISRO Procedure: Delay all orbital adjustment maneuvers during geomagnetic storms.",
        "ISRO Warning: High energy electrons can cause deep dielectric charging in GEO satellites like GSAT. Monitor telemetry.",
        "ISRO Safe-Mode: Optical payloads on EOS satellites must be shielded during solar particle events.",
        "ISRO Comm Protocol: Switch to backup ground stations if primary station experiences radio blackout.",
        "ISRO Procedure: Reboot star trackers if attitude control anomalies occur post-flare.",
        "ISRO Alert: Notify deep space network for potential tracking issues of lunar missions during solar storms.",
        "ISRO Protocol: Power down non-essential payload instruments on Cartosat series during M-class flares.",
        "ISRO Procedure: Increase telemetry polling frequency for all active satellites during solar maximum events.",
        "ISRO Warning: Expect single event upsets (SEUs) in satellite memory banks during high radiation periods.",
        "ISRO Safe-Mode: Orient solar panels edge-on to the sun if thermal limits are exceeded due to solar flux.",
        "ISRO Protocol: Perform health check on all subsystems post-flare before resuming normal operations."
    ]
    for proc in isro_procs:
        docs.append(Document(page_content=proc, metadata={"source": "ISRO_PROCEDURE"}))

    print("Chunking and indexing...")
    chunks = splitter.split_documents(docs)
    
    # Ensure directory exists
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # backend dir
    persist_dir = os.path.join(base_dir, "data", "chroma_solar_db")
    os.makedirs(persist_dir, exist_ok=True)
    
    vectorstore = Chroma.from_documents(chunks, embeddings, persist_directory=persist_dir)
    vectorstore.persist()
    
    print(f"Indexed {len(chunks)} documents across 3 sources")

if __name__ == "__main__":
    ingest_data()
