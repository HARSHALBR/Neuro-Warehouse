"""
NeuroWarehouse — FastAPI Application Entrypoint & Lifespan Orchestrator.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio
import logging
from pathlib import Path

from .config import settings
from .core.state_manager import WarehouseStateManager
from .core.astar import AStarPlanner
from .core.simulation import WarehouseSimulation
from .api.v1 import api_v1_router
from .api.websocket import ws_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("neurowarehouse")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan:
    - Sets up state manager, A* planner, and simulation engine.
    - Connects simulation tick listener to WebSocket broadcaster.
    - Starts the 10Hz kinematics loop.
    - Gracefully cleans up on shutdown.
    """
    logger.info("Initializing NeuroWarehouse core engines...")
    
    # Instantiate Singletons
    state_mgr = WarehouseStateManager(width=settings.GRID_WIDTH, height=settings.GRID_HEIGHT)
    planner = AStarPlanner(width=settings.GRID_WIDTH, height=settings.GRID_HEIGHT)
    simulation = WarehouseSimulation(
        state_manager=state_mgr,
        planner=planner,
        tick_rate_hz=settings.SIMULATION_TICK_HZ
    )

    # Attach WebSocket streaming listener to simulation tick
    async def on_sim_tick(state_payload):
        await ws_manager.broadcast_json({
            "type": "TICK",
            "robots": state_payload.get("robots", {}),
            "kpis": state_payload.get("kpis", {}),
            "orders": state_payload.get("orders", {}),
        })

    simulation.add_tick_listener(on_sim_tick)
    simulation.start()

    # Store handles in app state
    app.state.state_manager = state_mgr
    app.state.planner = planner
    app.state.simulation = simulation
    app.state.ws_manager = ws_manager
    app.state.decisions_store = {}

    logger.info("NeuroWarehouse core simulation started at 10Hz.")
    yield

    logger.info("Stopping NeuroWarehouse simulation loop...")
    simulation.stop()
    logger.info("NeuroWarehouse shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous Warehouse Decision and Recovery System inside a Digital Twin",
    lifespan=lifespan
)

# CORS Configuration for local frontend and mobile access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routes
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

# Mount Mobile Client Static App
mobile_dir = Path(__file__).resolve().parent.parent.parent / "mobile-client"
if mobile_dir.exists():
    app.mount("/mobile", StaticFiles(directory=str(mobile_dir), html=True), name="mobile")


@app.get("/")
async def root():
    return {
        "system": "NeuroWarehouse",
        "tagline": "BREAK IT. WATCH IT HEAL. SEE WHY.",
        "status": "OPERATIONAL",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }


@app.websocket("/ws/warehouse")
async def warehouse_websocket(websocket: WebSocket):
    """
    Primary real-time WebSocket channel:
    - Streams 10Hz kinematics state ticks.
    - Streams live agent thought feed events.
    - Accepts incoming client triggers.
    """
    await ws_manager.connect(websocket)
    try:
        # Send initial full state immediately upon connection
        state_mgr = app.state.state_manager
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "state": state_mgr.state.model_dump()
        })

        while True:
            # Keep connection open and accept client messages/heartbeats
            data = await websocket.receive_text()
            # Handle client-sent ping or commands if any
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WebSocket connection closed: {e}")
        ws_manager.disconnect(websocket)
