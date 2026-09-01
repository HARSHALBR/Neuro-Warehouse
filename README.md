# NeuroWarehouse

> **"BREAK IT. WATCH IT HEAL. SEE WHY."**  
> *AI-Powered Autonomous Warehouse Decision and Recovery System operating inside a real-time software Digital Twin.*

Developed for **iQOO Hackathon 2026 — City Battles (Pune City Battle)**.

---

## 🌟 Key Features

- **🧠 Multi-Agent Operational Intelligence**:
  - **Perception Agent**: Analyzes disruptions, scopes affected inventory orders, and identifies recovery coordinates.
  - **Reasoning Agent**: Evaluates fleet candidates using multi-factor optimization (**Battery Reserve 35% + A\* Path Distance 35% + Corridor Congestion 20% + Fleet Workload 10%**), powered by local/offline LLMs (Ollama `gemma3:4b`).
  - **Execution & Validation Agent**: Generates obstacle-free A\* paths and enforces deterministic closed-loop verification (zero collision, battery margin threshold) before mutating live operations.
- **🏭 3D Real-Time Digital Twin**:
  - Next.js 14 + React + Three.js command center streaming authoritative 10Hz kinematics state over WebSockets.
  - 12 AGV robots with smooth lerp interpolation, status rings (🟢 Normal, 🔴 Failed, 🟣 Recovering, 🔵 Charging), and dynamic 3D A\* trajectory ribbons.
- **📱 iQOO Phone & Field Client**:
  - Tactile fleet grid, Web Speech API voice trigger (*"Robot R04 failure"*), and camera QR scanner.
  - Connected via local **n8n Webhook Broker** or direct FastAPI REST endpoints.
- **💡 Decision Factor Explainability**:
  - Transparent breakdown of why the selected AGV won over competing candidates.
- **🔮 What-If Sandbox Simulator**:
  - Deep-clones state snapshots to simulate cascading secondary failures (e.g. *"What if R07 also fails?"*) with zero mutation to live operations.

---

## 🚀 Quick Start

### 1. Backend Server (FastAPI + Simulation + WebSockets)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
# Server runs on http://localhost:8000
# Mobile Operator UI runs on http://localhost:8000/mobile/
```

### 2. Frontend Command Center (Next.js + Three.js)
```bash
cd frontend
npm install
npm run dev
# Dashboard runs on http://localhost:3000
```

### 3. Run Backend Test Suite
```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
# 22/22 unit & integration tests
```

---

## 📁 Repository Structure

```text
NeuroWarehouse/
├── backend/
│   ├── app/
│   │   ├── agents/          # LangGraph Perception, Reasoning, Execution, Validation
│   │   ├── api/             # FastAPI REST & WebSocket endpoints
│   │   ├── core/            # A* Planner, State Manager, Simulation, Scoring
│   │   ├── explainability/  # Decision factor explanation engine
│   │   └── whatif/          # Snapshot cloning & sandbox simulator
│   └── tests/               # 22 automated unit & integration tests
│
├── frontend/
│   └── src/
│       ├── app/             # Next.js Command Center page & layout
│       ├── components/3d/   # Three.js 3D WebGL Digital Twin canvas
│       └── components/hud/  # Top KPI Bar, Agent Feed, Explainability, What-If
│
├── mobile-client/           # Tactile, Voice & QR Mobile Operator UI
└── n8n-workflows/           # n8n Phone Incident Broker template
```

---

## ⚖️ License
MIT License. Built for the iQOO Hackathon 2026.
