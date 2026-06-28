from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 15)
        self.cell(0, 10, "Bharatiya Antariksh Hackathon 2026", border=False, align="C")
        self.ln(10)
        self.set_draw_color(255, 165, 0) # Orange line
        self.line(10, 20, 200, 20)
        self.ln(5)

    def chapter_title(self, title):
        self.set_font("helvetica", "B", 14)
        self.set_text_color(0, 102, 204) # Blue
        self.cell(0, 10, title, border=False, align="L")
        self.ln(12)
        self.set_text_color(0, 0, 0)

    def chapter_body(self, body):
        self.set_font("helvetica", "", 11)
        self.multi_cell(0, 7, body)
        self.ln(5)

pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()

# Title Page
pdf.chapter_title("VyomOS - Autonomous Satellite Intelligence System")
pdf.chapter_body(
    "Team Name: ____________________\n"
    "Team Leader Name: ____________________\n"
    "Problem Statement: Antigravity Track (Autonomous Satellite Intelligence System)"
)

# Team Members
pdf.add_page()
pdf.chapter_title("Team Members")
pdf.chapter_body(
    "Team Leader: \nName: _________________ College: _________________\n\n"
    "Team Member-1: \nName: _________________ College: _________________\n\n"
    "Team Member-2: \nName: _________________ College: _________________\n\n"
    "Team Member-3: \nName: _________________ College: _________________\n"
)

# Opportunity
pdf.add_page()
pdf.chapter_title("Opportunity")
pdf.set_font("helvetica", "B", 11)
pdf.cell(0, 7, "How different is it from any of the other existing ideas?", ln=True)
pdf.set_font("helvetica", "", 11)
pdf.multi_cell(0, 6, "Traditional operations rely on humans reading 2D telemetry dashboards. VyomOS shifts this paradigm by moving intelligence to the edge, processing anomalies autonomously using a local LLM, and providing mitigating commands instantly without internet dependency.")
pdf.ln(5)
pdf.set_font("helvetica", "B", 11)
pdf.cell(0, 7, "How will it be able to solve the problem?", ln=True)
pdf.set_font("helvetica", "", 11)
pdf.multi_cell(0, 6, "It reduces cognitive load and reaction time from minutes to milliseconds. By automating detection, explanation, and mitigation, VyomOS prevents catastrophic failures during events like solar flares.")
pdf.ln(5)
pdf.set_font("helvetica", "B", 11)
pdf.cell(0, 7, "USP of the proposed solution:", ln=True)
pdf.set_font("helvetica", "", 11)
pdf.multi_cell(0, 6, "- 100% Data Sovereignty (Zero reliance on OpenAI/Clouds)\n- Multi-Satellite Cascading Anomaly Correlation\n- Live integration with NASA DONKI and real Celestrak TLEs\n- Predictive ML forecasting for anomaly severity")

# Features
pdf.add_page()
pdf.chapter_title("List of features offered by the solution")
pdf.chapter_body(
    "- 3D Digital Twin: Real-time WebGL visualization of ISRO's fleet using live TLEs.\n"
    "- Autonomous AI Mitigation: On-device LLM (Flan-T5) generates instant recovery strategies.\n"
    "- ISRO RAG Engine: Mitigation is grounded in actual ISRO mission protocols using ChromaDB.\n"
    "- Predictive Forecasting: ML model predicts anomaly severity 72 hours into the future.\n"
    "- NASA DONKI Integration: Automatically triggers alerts based on real space weather.\n"
    "- Telemetry Gauges & Heatmaps: Live tracking of battery, solar output, and historical anomaly density.\n"
    "- Voice Alert System: Auditory warnings for critical events.\n"
    "- Automated Incident Reports: One-click PDF generation for mission control logging."
)

# Process Flow
pdf.add_page()
pdf.chapter_title("Process flow diagram / Use-case diagram")
pdf.set_font("Courier", "", 10)
pdf.multi_cell(0, 5, 
    "[Satellite Sensor / Edge] -> (Detects Anomaly & Transmits Payload)\n"
    "       |\n"
    "       v\n"
    "[FastAPI Ground Gateway] -> (Validates Payload)\n"
    "       |\n"
    "       +--> [ChromaDB RAG Engine] (Fetches ISRO Context)\n"
    "       +--> [Predictive ML] (Forecasts 72hr Severity)\n"
    "       |\n"
    "       v\n"
    "[Local LLM (Flan-T5)] -> (Generates Mitigation)\n"
    "       |\n"
    "       v\n"
    "[React 3D Command Center] -> (Plots on Globe, Triggers Alerts)"
)
pdf.set_font("helvetica", "", 11)

# Wireframes
pdf.add_page()
pdf.chapter_title("Wireframes / Mock diagrams of the proposed solution")
pdf.chapter_body(
    "Command Center Layout:\n\n"
    "1. Top Bar: Ticker tape showing live X-Ray Flux and Flare Classes, and an Alert Banner.\n\n"
    "2. Left Panel: Satellite status matrix, NavIC impact, and live Telemetry Gauges (Recharts).\n\n"
    "3. Center/Right: A massive interactive 3D Globe rendering ISRO satellites, orbital paths, Day/Night terminators, and pulsing Red Alert shockwaves.\n\n"
    "4. Bottom Panel: 72-hour predictive anomaly severity chart.\n\n"
    "5. Floating Assistant: A chat window powered by Gemini 3.5 Flash for ad-hoc space weather queries."
)

# Architecture
pdf.add_page()
pdf.chapter_title("Architecture diagram of the proposed solution")
pdf.set_font("Courier", "", 9)
pdf.multi_cell(0, 4, 
    "EXTERNAL LIVE DATA FEEDS (NASA DONKI & Celestrak)\n"
    "              |\n"
    "BACKEND (FastAPI + Python)\n"
    "  [API Router] <-- (Anomaly Payload)\n"
    "       |-- [ChromaDB Vector Store] (ISRO PDFs)\n"
    "       |-- [Local LLM: Flan-T5] (RAG Context)\n"
    "       |-- [Predictive ML Engine] (Logistic Growth)\n"
    "              |\n"
    "FRONTEND (React + Vite + TypeScript)\n"
    "  - react-globe.gl (3D Visualization & Arcs)\n"
    "  - Recharts (Telemetry & Forecast)\n"
    "  - Web Speech API (Voice Alerts)\n"
    "  - jsPDF (Incident Reports)"
)
pdf.set_font("helvetica", "", 11)

# Technologies
pdf.add_page()
pdf.chapter_title("Technologies to be used in the solution")
pdf.chapter_body(
    "Frontend:\n"
    "- React 18, TypeScript, Vite\n"
    "- Tailwind CSS (Glassmorphic UI)\n"
    "- react-globe.gl & three.js (3D rendering)\n"
    "- recharts & d3 (Data visualization)\n"
    "- satellite.js (Orbital mechanics)\n\n"
    "Backend:\n"
    "- Python 3.10+, FastAPI, Uvicorn\n"
    "- Pydantic (Data validation)\n\n"
    "AI & Machine Learning:\n"
    "- chromadb (Vector Database for RAG)\n"
    "- sentence-transformers (Embeddings)\n"
    "- Google flan-t5-small (On-device LLM)\n"
    "- Gemini 3.5 Flash (Advisory Generation)\n"
    "- scipy & numpy (Predictive forecasting)"
)

# Cost
pdf.add_page()
pdf.chapter_title("Estimated implementation cost")
pdf.chapter_body(
    "Development & Software Cost:\n"
    "- $0 (VyomOS uses open-source frameworks, free public APIs like NASA DONKI, and local AI models).\n\n"
    "Deployment Hosting (Command Center):\n"
    "- $0 for Hackathon (Render/Vercel Free Tiers).\n"
    "- ~$50/month (Production-grade cloud backend).\n\n"
    "Edge Hardware (Per Satellite/Node):\n"
    "- ~$150 (NVIDIA Jetson Nano or equivalent space-hardened edge compute module for running the local LLM on-orbit).\n\n"
    "Total Prototype Cost: $0"
)

pdf.output(r"C:\Users\rohit\.gemini\antigravity-ide\brain\40eb1959-eb0d-4a17-8d52-b1f768cb1080\VyomOS_Presentation.pdf")
print("Done")
