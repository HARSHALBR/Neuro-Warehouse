"""
Warehouse state and management endpoints.
"""
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Dict, Any, List
from ...core.state_manager import WarehouseState, WarehouseKPIs

router = APIRouter(prefix="/warehouse", tags=["Warehouse"])


class ResetRequest(BaseModel):
    seed: int = 42


@router.get("/state", response_model=Dict[str, Any])
async def get_warehouse_state(request: Request):
    """Returns the authoritative live warehouse state."""
    state_mgr = request.app.state.state_manager
    return state_mgr.state.model_dump()


@router.post("/reset", response_model=Dict[str, Any])
async def reset_warehouse(request: Request, payload: ResetRequest = ResetRequest()):
    """Resets warehouse to the deterministic golden seed state."""
    state_mgr = request.app.state.state_manager
    state = state_mgr.reset_to_golden_seed()
    
    # Broadcast reset to WebSocket clients
    ws_mgr = request.app.state.ws_manager
    await ws_mgr.broadcast_json({"type": "RESET", "state": state.model_dump()})

    return {
        "status": "RESET_OK",
        "message": f"Warehouse restored to deterministic seed {payload.seed}.",
        "kpis": state.kpis.model_dump()
    }


@router.get("/kpis", response_model=WarehouseKPIs)
async def get_kpis(request: Request):
    """Returns current operational KPIs."""
    state_mgr = request.app.state.state_manager
    return state_mgr.recompute_kpis()


@router.get("/robots", response_model=Dict[str, Any])
async def get_robots(request: Request):
    """Returns status of all 12 fleet robots."""
    state_mgr = request.app.state.state_manager
    return {r_id: robot.model_dump() for r_id, robot in state_mgr.state.robots.items()}
