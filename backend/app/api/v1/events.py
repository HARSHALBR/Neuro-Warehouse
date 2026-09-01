"""
Operational Incident and Event Dispatch Endpoints.
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import uuid
from ...agents.graph import recovery_graph
from ...explainability.engine import ExplainabilityEngine

router = APIRouter(prefix="/events", tags=["Events & Incidents"])


class RobotFailureRequest(BaseModel):
    robot_id: str = "R04"
    source: str = "dashboard"  # "dashboard", "iqoo_phone", "simulation"
    notes: Optional[str] = None


class PhoneTriggerRequest(BaseModel):
    event_type: str = "robot_failure"
    robot_id: str = "R04"
    source: str = "iqoo_phone"
    notes: Optional[str] = "Reported via mobile operator"


@router.post("/robot-failure", response_model=Dict[str, Any])
async def trigger_robot_failure(request: Request, payload: RobotFailureRequest):
    """
    Triggers a robot failure disruption and runs the autonomous closed-loop recovery:
    1. Updates live simulation state (robot -> FAILED, order -> AFFECTED).
    2. Broadcasts failure event over WebSocket.
    3. Runs LangGraph 3-agent recovery loop.
    4. Applies validated recovery plan to the simulation.
    5. Stores decision and returns explainability summary.
    """
    state_mgr = request.app.state.state_manager
    ws_mgr = request.app.state.ws_manager
    decisions_store = request.app.state.decisions_store

    # 1. State disruption
    success, affected_orders = state_mgr.trigger_robot_failure(payload.robot_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Robot '{payload.robot_id}' not found.")

    incident_id = f"INC_{uuid.uuid4().hex[:8]}"

    # Broadcast failure event to UI
    await ws_mgr.broadcast_json({
        "type": "INCIDENT_DETECTED",
        "incident_id": incident_id,
        "robot_id": payload.robot_id,
        "affected_orders": affected_orders,
        "source": payload.source
    })

    # Broadcast Agent Thought: PERCEPTION
    await ws_mgr.broadcast_agent_step(
        agent="PERCEPTION",
        step="DETECTED",
        message=f"Robot {payload.robot_id} failure confirmed. Scoping affected orders: {affected_orders}."
    )

    # 2. Invoke LangGraph Recovery Pipeline
    agent_input = {
        "incident_id": incident_id,
        "incident_type": "robot_failure",
        "entity_id": payload.robot_id,
        "source": payload.source,
        "notes": payload.notes,
        "warehouse_snapshot": state_mgr.create_snapshot(),
        "agent_logs": [],
        "validation_errors": [],
        "iteration_count": 0
    }

    result = recovery_graph.invoke(agent_input)

    selected_id = result.get("selected_robot_id")
    plan = result.get("execution_plan")
    is_valid = result.get("validation_passed", False)
    eval_cands = result.get("evaluated_candidates", [])
    rationale = result.get("reasoning_rationale", "")

    # Broadcast Agent Thought: REASONING
    await ws_mgr.broadcast_agent_step(
        agent="REASONING",
        step="EVALUATED",
        message=f"Evaluated {len(eval_cands)} fleet candidates. Selected {selected_id} based on multi-factor scoring.",
        payload={"selected_robot": selected_id, "rationale": rationale}
    )

    # 3. Apply validated recovery plan
    if is_valid and selected_id and plan and affected_orders:
        route_pts = [tuple(p) for p in plan.get("route_waypoints", [])]
        state_mgr.apply_recovery_assignment(
            replacement_robot_id=selected_id,
            order_id=affected_orders[0],
            new_route=route_pts
        )

        # Broadcast Agent Thought: EXECUTION & VALIDATION
        await ws_mgr.broadcast_agent_step(
            agent="EXECUTION_VALIDATION",
            step="APPLIED",
            message=f"Route verified and reassigned to {selected_id}. Digital Twin state updated.",
            payload={"plan": plan}
        )

    # 4. Build and store explanation
    explanation = ExplainabilityEngine.build_explanation(
        incident_id=incident_id,
        failed_robot_id=payload.robot_id,
        selected_robot_id=selected_id or "NONE",
        evaluated_candidates=eval_cands,
        validation_passed=is_valid
    )
    decisions_store[explanation.decision_id] = explanation.model_dump()
    decisions_store["latest"] = explanation.model_dump()

    return {
        "status": "RECOVERY_EXECUTED" if is_valid else "RECOVERY_FAILED",
        "incident_id": incident_id,
        "failed_robot_id": payload.robot_id,
        "selected_robot_id": selected_id,
        "validation_passed": is_valid,
        "affected_orders": affected_orders,
        "explanation": explanation.model_dump(),
        "agent_logs": result.get("agent_logs", [])
    }


@router.post("/phone-trigger", response_model=Dict[str, Any])
async def phone_trigger(request: Request, payload: PhoneTriggerRequest):
    """
    Dedicated endpoint for the iQOO phone client and n8n webhook broker.
    Maps phone events into the core recovery workflow.
    """
    failure_req = RobotFailureRequest(
        robot_id=payload.robot_id,
        source=payload.source,
        notes=payload.notes
    )
    return await trigger_robot_failure(request, failure_req)
