"""
Integration tests for LangGraph 3-Agent Closed-Loop Recovery Pipeline.
"""
import pytest
from app.core.state_manager import WarehouseStateManager
from app.agents.graph import recovery_graph
from app.agents.perception import perception_node
from app.agents.reasoning import reasoning_node
from app.agents.execution import execution_node
from app.agents.validation import validation_node


def test_agent_graph_golden_path_execution():
    state_mgr = WarehouseStateManager()
    state_mgr.reset_to_golden_seed()

    # Trigger failure on R04 in state
    success, affected = state_mgr.trigger_robot_failure("R04")
    assert success is True

    snapshot = state_mgr.create_snapshot()

    initial_input = {
        "incident_id": "TEST_INC_001",
        "incident_type": "robot_failure",
        "entity_id": "R04",
        "source": "unit_test",
        "notes": "Testing golden recovery pipeline",
        "warehouse_snapshot": snapshot,
        "agent_logs": [],
        "validation_errors": [],
        "iteration_count": 0
    }

    # Run LangGraph closed-loop recovery workflow
    result = recovery_graph.invoke(initial_input)

    # 1. Verify Perception Output
    assert result["perceived_severity"] in ["CRITICAL", "HIGH"]
    assert "O104" in result["affected_orders"]
    assert result["target_location"] == [7, 7]

    # 2. Verify Reasoning Output
    assert len(result["evaluated_candidates"]) > 0
    # In the golden seed, R07 is dynamically evaluated as top candidate
    assert result["selected_robot_id"] == "R07"
    assert result["selected_candidate"] is not None
    assert result["selected_candidate"]["robot_id"] == "R07"
    assert "R07" in result["reasoning_rationale"]

    # 3. Verify Execution Output
    assert result["execution_plan"] is not None
    assert result["execution_plan"]["replacement_robot_id"] == "R07"
    assert len(result["proposed_route"]) > 0

    # 4. Verify Deterministic Validation
    assert result["validation_passed"] is True
    assert len(result["validation_errors"]) == 0
    assert result["iteration_count"] == 1
    assert "Recovery Validated" in result["explainability_summary"]

    # 5. Verify Agent Thought Logs
    agent_names = [log.get("agent") for log in result["agent_logs"]]
    assert "PERCEPTION" in agent_names
    assert "REASONING" in agent_names
    assert "EXECUTION" in agent_names
    assert "VALIDATION (DETERMINISTIC)" in agent_names


def test_agent_graph_validation_failure_handling():
    """
    Verify that if an invalid state is manually provided, deterministic
    validation correctly catches it.
    """
    state_mgr = WarehouseStateManager()
    state_mgr.reset_to_golden_seed()
    snapshot = state_mgr.create_snapshot()

    # Manually craft a state where the selected robot does not exist
    invalid_input = {
        "incident_id": "TEST_INVALID",
        "incident_type": "robot_failure",
        "entity_id": "R04",
        "source": "unit_test",
        "warehouse_snapshot": snapshot,
        "selected_robot_id": "R99_NON_EXISTENT",
        "agent_logs": [],
        "validation_errors": [],
        "iteration_count": 0
    }

    # Calling validation node directly with invalid input
    val_result = validation_node(invalid_input)
    assert val_result["validation_passed"] is False
    assert len(val_result["validation_errors"]) > 0
    assert any("does not exist" in err for err in val_result["validation_errors"])
