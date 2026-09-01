"""
Unit tests for dynamic multi-factor candidate scoring engine.
"""
import pytest
from app.core.state_manager import WarehouseStateManager
from app.core.astar import AStarPlanner
from app.core.scoring import CandidateScorer


def test_candidate_scoring_golden_seed_outcome():
    state_mgr = WarehouseStateManager()
    state_mgr.reset_to_golden_seed()
    
    planner = AStarPlanner(width=state_mgr.width, height=state_mgr.height)
    scorer = CandidateScorer(weight_battery=0.35, weight_distance=0.35, weight_congestion=0.20, weight_workload=0.10)

    # Trigger failure on R04
    success, affected = state_mgr.trigger_robot_failure("R04")
    assert success is True
    assert "O104" in affected

    target_loc = state_mgr.state.orders["O104"].pick_location  # (7, 7)

    # Genuinely compute candidate scores across all robots
    candidates = scorer.evaluate_candidates(
        state=state_mgr.state,
        failed_robot_id="R04",
        target_location=target_loc,
        planner=planner
    )

    assert len(candidates) > 0

    # Verify R04 is excluded from candidate list
    candidate_ids = [c.robot_id for c in candidates]
    assert "R04" not in candidate_ids

    # Find scores for R05, R07, and R09
    score_r05 = next(c for c in candidates if c.robot_id == "R05")
    score_r07 = next(c for c in candidates if c.robot_id == "R07")
    score_r09 = next(c for c in candidates if c.robot_id == "R09")

    # R05 has low battery (31%)
    assert score_r05.battery == 31.0
    # R07 has healthy battery (84%) and clear route
    assert score_r07.battery == 84.0
    # R07 score is higher than R05 and R09 due to multi-factor computation
    assert score_r07.composite_score > score_r05.composite_score
    assert score_r07.composite_score > score_r09.composite_score

    # R07 is the top calculated candidate under the seeded warehouse state
    top_candidate = candidates[0]
    assert top_candidate.robot_id == "R07"
    assert top_candidate.is_feasible is True
    assert len(top_candidate.route) > 0


def test_candidate_scoring_dynamic_non_hardcoded():
    state_mgr = WarehouseStateManager()
    state_mgr.reset_to_golden_seed()
    
    # Change R07 battery to 10% (below minimum safety threshold)
    state_mgr.state.robots["R07"].battery = 10.0
    # Boost R05 battery to 95%
    state_mgr.state.robots["R05"].battery = 95.0

    planner = AStarPlanner(width=state_mgr.width, height=state_mgr.height)
    scorer = CandidateScorer()

    target_loc = state_mgr.state.orders["O104"].pick_location

    candidates = scorer.evaluate_candidates(
        state=state_mgr.state,
        failed_robot_id="R04",
        target_location=target_loc,
        planner=planner
    )

    top_candidate = candidates[0]
    # Under modified state, R05 should dynamically win because R07 is battery-depleted
    assert top_candidate.robot_id == "R05"
    assert top_candidate.robot_id != "R07"
