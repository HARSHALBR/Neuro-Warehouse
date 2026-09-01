"""
LangGraph TypedDict State Definition for NeuroWarehouse Multi-Agent System.
"""
from typing import TypedDict, List, Dict, Any, Optional


class CandidateEvaluation(TypedDict):
    robot_id: str
    battery: float
    battery_margin: float
    distance: float
    congestion_penalty: float
    workload: int
    composite_score: float
    is_feasible: bool
    route: List[List[int]]
    factor_breakdown: Dict[str, Any]
    summary_reason: str


class WarehouseAgentState(TypedDict):
    # Disruption Context
    incident_id: str
    incident_type: str  # "robot_failure", "corridor_blocked", "battery_depleted"
    entity_id: str      # e.g. "R04"
    source: str         # "iqoo_phone", "dashboard", "simulation"
    notes: Optional[str]

    # Perception Agent Output
    perceived_severity: str
    affected_orders: List[str]
    affected_tasks: List[Dict[str, Any]]
    target_location: Optional[List[int]]
    warehouse_snapshot: Dict[str, Any]
    perception_summary: str

    # Candidate Scorer Output (Deterministic)
    evaluated_candidates: List[CandidateEvaluation]
    
    # Reasoning Agent Output (LLM / Strategic Reasoning)
    selected_robot_id: Optional[str]
    selected_candidate: Optional[CandidateEvaluation]
    reasoning_rationale: str
    decision_factors: List[Dict[str, Any]]

    # Execution Node Output
    proposed_route: Optional[List[List[int]]]
    reassigned_order_id: Optional[str]
    reassigned_task_id: Optional[str]
    execution_plan: Optional[Dict[str, Any]]

    # Deterministic Validation Output
    validation_passed: bool
    validation_errors: List[str]
    iteration_count: int

    # Final Explainability Output
    explainability_summary: str
    agent_logs: List[Dict[str, str]]
