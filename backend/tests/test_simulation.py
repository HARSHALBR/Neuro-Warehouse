"""
Unit tests for warehouse state manager and simulation kinematics loop.
"""
import pytest
from app.core.state_manager import WarehouseStateManager
from app.core.simulation import WarehouseSimulation
from app.core.astar import AStarPlanner


def test_state_manager_golden_reset():
    mgr = WarehouseStateManager(width=30, height=20)
    state = mgr.reset_to_golden_seed()

    assert len(state.robots) == 12
    assert len(state.shelves) == 48  # 4 cols * 12 rows
    assert len(state.orders) == 7
    assert state.kpis.active_robots == 12
    assert state.kpis.failed_robots == 0
    assert state.robots["R04"].status == "BUSY"
    assert state.robots["R07"].battery == 84.0


def test_robot_failure_and_recovery_flow():
    mgr = WarehouseStateManager()
    mgr.reset_to_golden_seed()

    # Trigger failure on R04
    success, affected_orders = mgr.trigger_robot_failure("R04")
    assert success is True
    assert affected_orders == ["O104"]
    assert mgr.state.robots["R04"].status == "FAILED"
    assert mgr.state.orders["O104"].status == "AFFECTED"
    assert mgr.state.kpis.failed_robots == 1
    assert mgr.state.kpis.affected_orders == 1

    # Apply recovery assignment to R07
    route = [(15, 14), (15, 13), (15, 12), (14, 12), (13, 12), (10, 12), (8, 12), (7, 12), (7, 7)]
    applied = mgr.apply_recovery_assignment(
        replacement_robot_id="R07",
        order_id="O104",
        new_route=route
    )
    assert applied is True
    assert mgr.state.robots["R07"].status == "RECOVERING"
    assert mgr.state.robots["R07"].assigned_order_id == "O104"
    assert mgr.state.orders["O104"].status == "IN_PROGRESS"
    assert mgr.state.orders["O104"].assigned_robot_id == "R07"
    assert mgr.state.kpis.affected_orders == 0


def test_simulation_kinematics_tick():
    mgr = WarehouseStateManager()
    mgr.reset_to_golden_seed()
    sim = WarehouseSimulation(state_manager=mgr, tick_rate_hz=10)

    # Set a moving route for R11
    mgr.state.robots["R11"].position = (0.0, 0.0)
    mgr.state.robots["R11"].route = [(0, 0), (0, 1), (0, 2)]
    mgr.state.robots["R11"].status = "MOVING"
    mgr.state.robots["R11"].route_index = 0
    initial_battery = mgr.state.robots["R11"].battery

    # Run 10 ticks (1.0 second elapsed at 1.0 m/s speed)
    for _ in range(10):
        sim.tick(dt=0.1)

    # Position should have advanced along the path
    cur_pos = mgr.state.robots["R11"].position
    assert cur_pos[1] > 0.0
    # Battery should have decreased slightly
    assert mgr.state.robots["R11"].battery < initial_battery
