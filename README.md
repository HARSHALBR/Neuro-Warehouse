# 🏭 NeuroWarehouse

> **"BREAK IT. WATCH IT HEAL. SEE WHY."**  
> *AI-Powered Autonomous Warehouse Decision & Self-Healing Operating System operating inside a real-time 3D Digital Twin.*

Developed for **iQOO Hackathon 2026 — City Battles (Pune City Battle)**.

---

## 🌟 Key Innovations & Features

### 1. 🧠 Multi-Agent Operational Intelligence (LangGraph Closed-Loop)
- **👁️ Perception Agent**: Detects stalls and sensor faults in $<50\text{ms}$, scopes affected inventory orders, and identifies recovery coordinates.
- **🧠 Reasoning Agent**: Evaluates fleet candidates using multi-factor optimization (**Battery Reserve 35% + A\* Path Distance 35% + Corridor Congestion 20% + Fleet Workload 10%**).
- **⚙️ Execution Node**: Generates dynamic collision-free A\* paths and calculates waypoint trajectories.
- **✓ Validation Node**: Deterministically verifies battery margins ($\ge 30\%$) and proves **zero coordinate collisions** before live dispatching.

### 2. 🏭 3D Real-Time Digital Twin (Next.js 14 + Three.js)
- Authoritative 10Hz kinematics simulation over WebSockets.
- 12 recognizable industrial AGV vehicles with 4 wheel hubs, sensor turrets, and status underglow rings.
- **Cinematic Camera Choreography**: Eases focus to framing incident zones and reassigning candidates on disruptions.
- **Thick Glowing A\* Trajectory Ribbons**: High-visibility glowing magenta route lines.

### 3. 🎨 Glassmorphism Design System & Dual Themes
- Shared `<GlassCard>` system with $20\text{px}$ backdrop blur, light-catching gradient glass rims, and ambient radial color washes.
- **Dual Light & Dark Theme Architecture**: Instant toggle between deep slate-navy and high-contrast crystal white palettes.
- **Presentation Mode**: Fullscreen mode maximizing viewport and 3D canvas for projectors and screen mirroring.

### 4. 📱 iQOO Mobile Edge Operator Client
- Responsive mobile web client (`/mobile/`) with embedded dark glassmorphism design.
- 12-robot tactile grid with live telemetry, **Web Speech API voice triggers** (*"Robot R04 failure"*), and camera QR code scanner.

### 5. 💡 Decision Factor Explainability & Deliberation Matrix
- Transparent factor scoring (**84% Battery**, **15m A\* Dist**, **0.0 Congestion**) showing why the winner was chosen and why competing candidates were disqualified.

### 6. 🔮 What-If Counterfactual Sandbox Engine
- Deep-clones warehouse state in memory to simulate cascading secondary disruptions (e.g. *"What if R07 also fails?"*) with guaranteed **zero live-state mutation**.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       📱 iQOO MOBILE EDGE CLIENT                            │
│  [QR Code Scan / Voice Command / Touch Failure Trigger / Status Push]       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP POST / Webhook
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ⚡ FASTAPI BACKEND (Python 3.12)                     │
│  • 10Hz Kinematics Simulation Loop (30×20 Grid, 12 AGVs, Dynamic Shelves)   │
│  • WebSocket Broadcast Engine (`/ws/warehouse`)                             │
│  • Deep State Cloner for What-If Sandbox Isolation                          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ State Snapshot
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     🧠 3-AGENT LANGGRAPH RECOVERY PIPELINE                   │
│                                                                             │
│  ┌────────────────────┐    ┌────────────────────┐    ┌───────────────────┐  │
│  │ 👁 PERCEPTION AGENT│───►│ 🧠 REASONING AGENT │───►│ ⚙ EXECUTION NODE  │  │
│  │ Detects Stall/Fault│    │ Multi-Factor Score │    │ A* Route Planner  │  │
│  └────────────────────┘    └────────────────────┘    └─────────┬─────────┘  │
│                                                                │            │
│                                                                ▼            │
│                                                      ┌───────────────────┐  │
│                                                      │ ✓ VALIDATION NODE │  │
│                                                      │ Collision Checked │  │
│                                                      └───────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ 10Hz Real-Time State Stream (WS)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 💻 NEXT.JS 14 + THREE.JS COMMAND CENTER                      │
│  • 3D WebGL Digital Twin with Camera Choreography & Glowing Trajectory Lines│
│  • Glassmorphism Surface Materiality & Animated Number Tweening             │
│  • Dual Light/Dark Theme Architecture with Instant Top-Bar Toggle           │
│  • Explainability Panel ("Why R07?" Factor Breakdown & Deliberation Matrix) │
│  • What-If Cascading Simulation Dual-Column Diff Modal                      │
│  • Fullscreen Presentation Mode for Projectors / Mirroring                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start & Execution

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

### 2. Frontend Command Center (Next.js 14 + Three.js)
```bash
cd frontend
npm install
npm run dev
# Command Center runs on http://localhost:3000
# Mobile Client also accessible on http://localhost:3000/mobile/
```

### 3. Automated Test Suite (22/22 Passing)
```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
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
│   ├── public/mobile/       # Mobile client static assets
│   └── src/
│       ├── app/             # Next.js Command Center page, layout, globals.css
│       ├── components/3d/   # Three.js 3D WebGL Digital Twin canvas
│       ├── components/common/ # GlassCard and AnimatedCounter primitives
│       ├── components/hud/  # Top KPI Bar, Agent Feed, Explainability, What-If
│       └── hooks/           # useWarehouseSocket, useTheme
│
├── mobile-client/           # Standalone iQOO Tactile, Voice & QR Operator UI
└── n8n-workflows/           # n8n Phone Incident Broker template
```

---

## ⚖️ License
MIT License. Built for the iQOO Hackathon 2026.
