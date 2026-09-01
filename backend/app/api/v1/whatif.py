"""
What-If Hypothetical Simulation Endpoints.
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from ...whatif.simulator import WhatIfSimulator, WhatIfResult

router = APIRouter(prefix="/simulation", tags=["What-If Simulation"])


class WhatIfRequest(BaseModel):
    hypothetical_failure_robot_id: str = "R07"
    baseline_failed_robot_id: str = "R04"


@router.post("/what-if", response_model=Dict[str, Any])
async def run_what_if_simulation(request: Request, payload: WhatIfRequest):
    """
    Executes a hypothetical secondary failure scenario in a sandbox without mutating live state.
    """
    state_mgr = request.app.state.state_manager
    simulator = WhatIfSimulator(state_manager=state_mgr)

    result: WhatIfResult = simulator.run_hypothetical_failure(
        hypothetical_robot_id=payload.hypothetical_failure_robot_id,
        baseline_failed_id=payload.baseline_failed_robot_id
    )

    return result.model_dump()
