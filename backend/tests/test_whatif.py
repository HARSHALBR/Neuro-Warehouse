"""
Unit and integration tests for What-If sandbox simulation.
"""
import pytest
from app.core.state_manager import WarehouseStateManager
from app.whatif.simulator import WhatIfSimulator


def test_whatif_isolated_execution():
    state_mgr = WarehouseStateManager()
    state_mgr.reset_to_golden_seed()

    # Trigger primary failure on R04 and apply baseline recovery to R07
    state_mgr.trigger_robot_failure("R04")
    state_mgr.apply_recovery_assignment("R07", "O104", [(15, 14), (15, 13), (7, 7)])

    # Record baseline state values
    initial_r07_status = state_mgr.state.robots["R07"].status
    initial_r04_status = state_mgr.state.robots["R04"].status
    initial_efficiency = state_mgr.state.kpis.warehouse_efficiency

    simulator = WhatIfSimulator(state_manager=state_mgr)

    # Run What-If: "What if R07 also fails?"
    whatif_result = simulator.run_hypothetical_failure(
        hypothetical_robot_id="R07",
        baseline_failed_id="R04",
        baseline_selected_id="R07"
    )

    # 1. Verify that LIVE state was NOT mutated
    assert state_mgr.state.robots["R07"].status == initial_r07_status
    assert state_mgr.state.robots["R04"].status == initial_r04_status
    assert state_mgr.state.kpis.warehouse_efficiency == initial_efficiency

    # 2. Verify What-If simulation outputs
    assert whatif_result.baseline_failed_robot == "R04"
    assert whatif_result.hypothetical_failed_robot == "R07"
    assert whatif_result.simulated_selected_robot is not None
    # Simulated selected robot should be an available robot other than R04 and R07
    assert whatif_result.simulated_selected_robot not in ["R04", "R07"]
    assert whatif_result.simulated_efficiency < initial_efficiency
    assert len(whatif_result.impact_analysis) > 0
    assert whatif_result.simulated_explanation is not None
