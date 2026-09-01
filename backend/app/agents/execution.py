"""
Execution Node for NeuroWarehouse Recovery Pipeline.
Assembles concrete recovery plan and route trajectory.
"""
from typing import Dict, Any, List, Optional
from .state import WarehouseAgentState


def execution_node(state: WarehouseAgentState) -> Dict[str, Any]:
    """
    Execution Node:
    - Prepares the operational reassignment plan.
    - Extracts the computed A* route for the selected candidate.
    - Packages execution steps for downstream validation.
    """
    selected_id = state.get("selected_robot_id")
    selected_cand = state.get("selected_candidate")
    affected_orders = state.get("affected_orders", [])
    target_loc = state.get("target_location", [0, 0])

    if not selected_id or not selected_cand:
        summary_msg = "Execution halted: No valid robot candidate provided by reasoning."
        logs = list(state.get("agent_logs", []))
        logs.append({"agent": "EXECUTION", "message": summary_msg})
        return {
            "proposed_route": None,
            "reassigned_order_id": None,
            "execution_plan": None,
            "agent_logs": logs
        }

    order_id = affected_orders[0] if affected_orders else None
    route = selected_cand.get("route", [])

    execution_plan = {
        "action": "REASSIGN_AND_DISPATCH",
        "replacement_robot_id": selected_id,
        "affected_order_id": order_id,
        "target_location": target_loc,
        "route_waypoints": route,
        "estimated_steps": len(route),
        "target_status": "RECOVERING"
    }

    summary_msg = (
        f"Execution plan formulated: Reassign order '{order_id}' to robot '{selected_id}'. "
        f"Generated {len(route)}-point trajectory to {target_loc}."
    )

    logs = list(state.get("agent_logs", []))
    logs.append({
        "agent": "EXECUTION",
        "message": summary_msg,
        "plan": execution_plan
    })

    return {
        "proposed_route": route,
        "reassigned_order_id": order_id,
        "execution_plan": execution_plan,
        "agent_logs": logs
    }
