"""
Deterministic Validation Node for NeuroWarehouse Recovery.
Enforces closed-loop physical feasibility, battery constraints, and collision freedom.
"""
from typing import Dict, Any, List
from ..config import settings
from .state import WarehouseAgentState


def validation_node(state: WarehouseAgentState) -> Dict[str, Any]:
    """
    Deterministic Validation Node:
    - Verifies that the proposed execution plan is physically and operationally valid.
    - If valid -> marks validation_passed=True and produces final explainability summary.
    - If invalid -> appends errors and increments iteration_count for closed-loop retry.
    """
    snapshot = state.get("warehouse_snapshot", {})
    failed_id = state.get("entity_id", "")
    selected_id = state.get("selected_robot_id")
    selected_cand = state.get("selected_candidate")
    plan = state.get("execution_plan")
    route = state.get("proposed_route")
    iteration = state.get("iteration_count", 0)

    robots = snapshot.get("robots", {})
    shelves = snapshot.get("shelves", {})
    static_obstacles = {(s["position"][0], s["position"][1]) for s in shelves.values()}

    failed_robot = robots.get(failed_id)
    failed_pos = (
        (int(round(failed_robot["position"][0])), int(round(failed_robot["position"][1])))
        if failed_robot else None
    )

    errors: List[str] = []

    # 1. Existence and status check
    if not selected_id or selected_id not in robots:
        errors.append(f"Selected robot '{selected_id}' does not exist in fleet snapshot.")
    else:
        robot_data = robots[selected_id]
        if robot_data.get("status") == "FAILED":
            errors.append(f"Selected robot '{selected_id}' is in FAILED status.")

    # 2. Battery margin check
    if selected_cand:
        margin = selected_cand.get("battery_margin", 0.0)
        if margin < settings.MIN_BATTERY_THRESHOLD:
            errors.append(
                f"Battery margin ({margin:.1f}%) for '{selected_id}' is below safety threshold ({settings.MIN_BATTERY_THRESHOLD}%)."
            )

    # 3. Route feasibility and obstacle collision check
    if not route or len(route) == 0:
        errors.append(f"No navigable route generated for '{selected_id}'.")
    else:
        for pt in route:
            grid_pt = (pt[0], pt[1])
            if grid_pt in static_obstacles:
                errors.append(f"Route collides with static shelf obstacle at {grid_pt}.")
                break
            if failed_pos and grid_pt == failed_pos:
                errors.append(f"Route collides with failed robot {failed_id} at {grid_pt}.")
                break

    # 4. Plan completeness
    if not plan:
        errors.append("Execution plan payload is empty.")

    is_valid = len(errors) == 0
    new_iteration = iteration + 1

    logs = list(state.get("agent_logs", []))

    if is_valid:
        explain_summary = (
            f"Recovery Validated: Robot {selected_id} assigned to recover mission from failed {failed_id}. "
            f"Route verified ({len(route)} waypoints, 0 collisions). "
            f"Battery margin verified ({selected_cand.get('battery_margin', 0.0):.0f}%). Closed-loop recovery confirmed."
        )
        logs.append({
            "agent": "VALIDATION (DETERMINISTIC)",
            "status": "PASSED",
            "message": explain_summary
        })
    else:
        explain_summary = f"Validation Failed on iteration {new_iteration}: {'; '.join(errors)}"
        logs.append({
            "agent": "VALIDATION (DETERMINISTIC)",
            "status": "FAILED",
            "errors": errors,
            "message": explain_summary
        })

    return {
        "validation_passed": is_valid,
        "validation_errors": errors,
        "iteration_count": new_iteration,
        "explainability_summary": explain_summary,
        "agent_logs": logs
    }
