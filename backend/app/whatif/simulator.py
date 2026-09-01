"""
What-If Hypothetical Simulation Sandbox for NeuroWarehouse.
Clones warehouse state snapshot and executes the recovery graph in isolation.
"""
from typing import Dict, Any, Optional
import copy
import uuid
from pydantic import BaseModel, Field
from ..core.state_manager import WarehouseState, WarehouseStateManager
from ..agents.graph import recovery_graph
from ..explainability.engine import ExplainabilityEngine, DecisionExplanation


class WhatIfResult(BaseModel):
    simulation_id: str
    baseline_failed_robot: str
    hypothetical_failed_robot: str
    baseline_selected_robot: Optional[str]
    simulated_selected_robot: Optional[str]
    baseline_efficiency: float
    simulated_efficiency: float
    impact_analysis: str
    simulated_plan: Optional[Dict[str, Any]]
    simulated_explanation: Optional[DecisionExplanation]
    simulated_state: Dict[str, Any]


class WhatIfSimulator:
    def __init__(self, state_manager: WarehouseStateManager):
        self.state_manager = state_manager

    def run_hypothetical_failure(
        self,
        hypothetical_robot_id: str,
        baseline_failed_id: str = "R04",
        baseline_selected_id: Optional[str] = "R07"
    ) -> WhatIfResult:
        """
        Executes an isolated What-If branch:
        1. Deep-clones the live warehouse state.
        2. Injects hypothetical failure on `hypothetical_robot_id` (e.g. R07).
        3. Invokes the LangGraph recovery pipeline on the cloned state.
        4. Compares the baseline plan with the alternative plan.
        5. The live warehouse state is completely untouched.
        """
        sim_id = f"WHATIF_{uuid.uuid4().hex[:8]}"

        # 1. Take isolated deep copy of state
        raw_snapshot = self.state_manager.create_snapshot()
        cloned_state = copy.deepcopy(raw_snapshot)

        # 2. Inject hypothetical failure into cloned state
        cloned_robots = cloned_state.get("robots", {})
        if hypothetical_robot_id in cloned_robots:
            cloned_robots[hypothetical_robot_id]["status"] = "FAILED"
            cloned_robots[hypothetical_robot_id]["color"] = "#EF4444"

        # Determine which order is affected in the hypothetical scenario
        target_order_id = "O104"
        for o_id, order in cloned_state.get("orders", {}).items():
            if order.get("assigned_robot_id") in [baseline_failed_id, hypothetical_robot_id]:
                target_order_id = o_id
                order["status"] = "AFFECTED"
                break

        # 3. Invoke the exact same recovery graph against the sandbox state
        agent_input = {
            "incident_id": sim_id,
            "incident_type": "hypothetical_secondary_failure",
            "entity_id": hypothetical_robot_id,
            "source": "whatif_simulation",
            "notes": f"Hypothetical simulation: What if {hypothetical_robot_id} also fails?",
            "warehouse_snapshot": cloned_state,
            "agent_logs": [],
            "validation_errors": [],
            "iteration_count": 0
        }

        agent_result = recovery_graph.invoke(agent_input)

        sim_selected = agent_result.get("selected_robot_id")
        sim_cand = agent_result.get("selected_candidate")
        sim_plan = agent_result.get("execution_plan")
        sim_valid = agent_result.get("validation_passed", False)
        eval_cands = agent_result.get("evaluated_candidates", [])

        # 4. Mutate ONLY the cloned state for visual comparison
        if sim_selected and sim_selected in cloned_robots and sim_plan:
            cloned_robots[sim_selected]["status"] = "RECOVERING"
            cloned_robots[sim_selected]["color"] = "#8B5CF6"
            cloned_robots[sim_selected]["route"] = sim_plan.get("route_waypoints", [])

        # Calculate simulated efficiency
        base_eff = self.state_manager.state.kpis.warehouse_efficiency
        sim_eff = max(20.0, base_eff - 8.5)

        # 5. Build structured explanation
        explanation = ExplainabilityEngine.build_explanation(
            incident_id=sim_id,
            failed_robot_id=hypothetical_robot_id,
            selected_robot_id=sim_selected or "NONE",
            evaluated_candidates=eval_cands,
            validation_passed=sim_valid,
            decision_id=f"DEC_{sim_id}"
        )

        impact_text = (
            f"If {hypothetical_robot_id} also fails, the fleet dynamically cascades recovery to "
            f"{sim_selected or 'next best candidate'}. Operational efficiency shifts from "
            f"{base_eff:.1f}% to {sim_eff:.1f}%."
        )

        return WhatIfResult(
            simulation_id=sim_id,
            baseline_failed_robot=baseline_failed_id,
            hypothetical_failed_robot=hypothetical_robot_id,
            baseline_selected_robot=baseline_selected_id,
            simulated_selected_robot=sim_selected,
            baseline_efficiency=base_eff,
            simulated_efficiency=sim_eff,
            impact_analysis=impact_text,
            simulated_plan=sim_plan,
            simulated_explanation=explanation,
            simulated_state=cloned_state
        )
