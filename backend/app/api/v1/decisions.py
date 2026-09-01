"""
Decision log and explainability endpoints.
"""
from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any

router = APIRouter(prefix="/decisions", tags=["Decisions & Explainability"])


@router.get("/latest", response_model=Dict[str, Any])
async def get_latest_decision(request: Request):
    """Returns the latest recovery decision and its explainability factor matrix."""
    decisions_store = request.app.state.decisions_store
    if "latest" not in decisions_store:
        return {
            "status": "NO_DECISIONS",
            "message": "No recovery decisions recorded yet. Warehouse is in normal operating state."
        }
    return decisions_store["latest"]


@router.get("/{decision_id}", response_model=Dict[str, Any])
async def get_decision_by_id(request: Request, decision_id: str):
    """Returns a specific decision explanation by ID."""
    decisions_store = request.app.state.decisions_store
    if decision_id not in decisions_store:
        raise HTTPException(status_code=404, detail=f"Decision '{decision_id}' not found.")
    return decisions_store[decision_id]
