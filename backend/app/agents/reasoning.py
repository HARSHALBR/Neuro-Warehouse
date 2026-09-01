"""
Reasoning Agent for NeuroWarehouse.
Combines deterministic candidate evaluation with strategic LLM reasoning and explanation.
"""
from typing import Dict, Any, List, Optional
import json
import logging
from ..core.state_manager import WarehouseState, WarehouseStateManager
from ..core.astar import AStarPlanner
from ..core.scoring import CandidateScorer
from ..config import settings
from .state import WarehouseAgentState, CandidateEvaluation

logger = logging.getLogger("neurowarehouse.reasoning")


def _call_llm_reasoning(
    failed_id: str,
    target_loc: List[int],
    candidates: List[CandidateEvaluation],
    severity: str
) -> Dict[str, Any]:
    """
    Invokes Local LLM (Ollama gemma3:4b or fallback) to evaluate strategic trade-offs
    and generate natural-language rationale.
    """
    top_candidate = candidates[0] if candidates else None
    if not top_candidate:
        return {
            "selected_robot_id": None,
            "rationale": "No feasible candidate robots available in fleet.",
            "factors": []
        }

    # If Ollama is available, we can format a prompt. We also have deterministic prompt formatting
    # that guarantees zero hallucination by selecting from top candidate metrics.
    # Let's attempt Ollama local reasoning with timeout, falling back gracefully.
    try:
        if settings.LLM_PROVIDER == "ollama":
            import httpx
            prompt = f"""You are the Warehouse Reasoning Mind.
A disruption occurred: Robot {failed_id} failed while serving pick location {target_loc}.
Evaluated candidate robots:
{json.dumps([{'id': c['robot_id'], 'battery': f"{c['battery']:.0f}%", 'distance': f"{c['distance']:.0f}m", 'congestion': c['congestion_penalty'], 'score': c['composite_score']} for c in candidates[:3]], indent=2)}

Provide a concise, 1-2 sentence operational explanation for why Robot {top_candidate['robot_id']} is the optimal replacement."""

            with httpx.Client(timeout=2.0) as client:
                res = client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={"model": settings.OLLAMA_MODEL, "prompt": prompt, "stream": False}
                )
                if res.status_code == 200:
                    llm_text = res.json().get("response", "").strip()
                    if llm_text:
                        return {
                            "selected_robot_id": top_candidate["robot_id"],
                            "rationale": llm_text,
                            "factors": top_candidate.get("factor_breakdown", {})
                        }
    except Exception as e:
        logger.debug(f"Ollama local call skipped or timed out ({e}), using deterministic rationale engine.")

    # High-quality deterministic operational rationale
    factors = top_candidate.get("factor_breakdown", {})
    bat_val = factors.get("battery", {}).get("value", f"{top_candidate['battery']:.0f}%")
    dist_val = factors.get("distance", {}).get("value", f"{top_candidate['distance']:.0f}m")
    cong_val = factors.get("congestion", {}).get("value", f"{top_candidate['congestion_penalty']:.1f}")

    rationale = (
        f"Selected {top_candidate['robot_id']} (Composite Score: {top_candidate['composite_score']:.2f}). "
        f"Maintains optimal battery margin ({bat_val}), feasible path length ({dist_val}), "
        f"and minimal corridor congestion penalty ({cong_val})."
    )

    return {
        "selected_robot_id": top_candidate["robot_id"],
        "rationale": rationale,
        "factors": factors
    }


def reasoning_node(state: WarehouseAgentState) -> Dict[str, Any]:
    """
    Reasoning Agent Node:
    - Runs CandidateScorer to evaluate all available fleet robots.
    - Excludes previously failed candidate IDs if looping from validation.
    - Produces strategic decision and structured explanation.
    """
    snapshot = state.get("warehouse_snapshot", {})
    failed_id = state.get("entity_id", "")
    target_loc = state.get("target_location", [0, 0])
    severity = state.get("perceived_severity", "MEDIUM")
    validation_errors = state.get("validation_errors", [])

    # Reconstruct WarehouseState object from snapshot
    state_obj = WarehouseState(**snapshot)
    planner = AStarPlanner(width=state_obj.grid_width, height=state_obj.grid_height)
    scorer = CandidateScorer(
        weight_battery=settings.WEIGHT_BATTERY,
        weight_distance=settings.WEIGHT_DISTANCE,
        weight_congestion=settings.WEIGHT_CONGESTION,
        weight_workload=settings.WEIGHT_WORKLOAD,
        min_battery_threshold=settings.MIN_BATTERY_THRESHOLD
    )

    # Deterministic candidate scoring
    scored_candidates = scorer.evaluate_candidates(
        state=state_obj,
        failed_robot_id=failed_id,
        target_location=(int(target_loc[0]), int(target_loc[1])),
        planner=planner
    )

    # Filter out infeasible candidates or ones with previous validation errors
    excluded_ids = set()
    for err in validation_errors:
        for c in scored_candidates:
            if c.robot_id in err:
                excluded_ids.add(c.robot_id)

    feasible_candidates = [
        c for c in scored_candidates
        if c.is_feasible and c.robot_id not in excluded_ids
    ]

    # Convert to typed dict format
    candidate_dicts: List[CandidateEvaluation] = [
        CandidateEvaluation(
            robot_id=c.robot_id,
            battery=c.battery,
            battery_margin=c.battery_margin,
            distance=c.distance,
            congestion_penalty=c.congestion_penalty,
            workload=c.workload,
            composite_score=c.composite_score,
            is_feasible=c.is_feasible,
            route=[list(pt) for pt in c.route],
            factor_breakdown=c.factor_breakdown,
            summary_reason=c.summary_reason
        )
        for c in feasible_candidates
    ]

    if not candidate_dicts:
        # Fallback if all candidates excluded
        selected_id = None
        selected_candidate = None
        rationale = "CRITICAL: No viable replacement robot found with sufficient battery and clear route."
        factors = {}
    else:
        llm_eval = _call_llm_reasoning(failed_id, target_loc, candidate_dicts, severity)
        selected_id = llm_eval["selected_robot_id"]
        selected_candidate = next((c for c in candidate_dicts if c["robot_id"] == selected_id), candidate_dicts[0])
        rationale = llm_eval["rationale"]
        factors = llm_eval["factors"]

    summary_msg = f"Reasoning Agent evaluated {len(candidate_dicts)} candidates. Selected {selected_id or 'None'}. Rationale: {rationale}"

    logs = list(state.get("agent_logs", []))
    logs.append({
        "agent": "REASONING",
        "message": summary_msg,
        "selected_robot": selected_id or "NONE"
    })

    return {
        "evaluated_candidates": candidate_dicts,
        "selected_robot_id": selected_id,
        "selected_candidate": selected_candidate,
        "reasoning_rationale": rationale,
        "decision_factors": factors,
        "agent_logs": logs
    }
