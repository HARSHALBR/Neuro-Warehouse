"""API v1 Router Aggregator."""
from fastapi import APIRouter
from .warehouse import router as warehouse_router
from .events import router as events_router
from .whatif import router as whatif_router
from .decisions import router as decisions_router

api_v1_router = APIRouter()
api_v1_router.include_router(warehouse_router)
api_v1_router.include_router(events_router)
api_v1_router.include_router(whatif_router)
api_v1_router.include_router(decisions_router)

__all__ = ["api_v1_router"]
