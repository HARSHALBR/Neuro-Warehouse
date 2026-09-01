"""
Perception Agent for NeuroWarehouse.
Responsible for structured incident understanding and impact scoping.
"""
from typing import Dict, Any, List
from .state import WarehouseAgentState


def perception_node(state: WarehouseAgentState) -> Dict[str, Any]:
    """
    Perception Agent Node:
    - Inspects warehouse snapshot and incident context.
    - Identifies affected orders and orphaned tasks.
    - Determines the pick location that needs recovery.
    - Generates a structured perception report.
    """
    snapshot = state.get("warehouse_snapshot", {})
    failed_id = state.get("entity_id", "")
    incident_type = state.get("incident_type", "robot_failure")

    robots = snapshot.get("robots", {})
    orders = snapshot.get("orders", {})
    tasks = snapshot.get("tasks", {})

    affected_orders: List[str] = []
    affected_tasks: List[Dict[str, Any]] = []
    target_location = None
    severity = "MEDIUM"

    failed_robot = robots.get(failed_id)
    if failed_robot:
        assigned_order_id = failed_robot.get("assigned_order_id")
        current_task_id = failed_robot.get("current_task_id")

        if assigned_order_id and assigned_order_id in orders:
            order_data = orders[assigned_order_id]
            affected_orders.append(assigned_order_id)
            target_location = list(order_data.get("pick_location", [0, 0]))
            order_prio = order_data.get("priority", "MEDIUM")
            if order_prio in ["HIGH", "CRITICAL"]:
                severity = "CRITICAL"

        if current_task_id and current_task_id in tasks:
            affected_tasks.append(tasks[current_task_id])

    # If robot had no order assigned, default target to its last known position
    if not target_location and failed_robot:
        target_location = [int(round(failed_robot.get("position", [0, 0])[0])), int(round(failed_robot.get("position", [0, 0])[1]))]

    summary = (
        f"Incident '{incident_type}' confirmed on entity {failed_id}. "
        f"Detected {len(affected_orders)} affected order(s) ({', '.join(affected_orders) or 'None'}). "
        f"Target recovery coordinate: {target_location} (Severity: {severity})."
    )

    logs = list(state.get("agent_logs", []))
    logs.append({
        "agent": "PERCEPTION",
        "message": summary,
        "severity": severity
    })

    return {
        "perceived_severity": severity,
        "affected_orders": affected_orders,
        "affected_tasks": affected_tasks,
        "target_location": target_location,
        "perception_summary": summary,
        "agent_logs": logs
    }
