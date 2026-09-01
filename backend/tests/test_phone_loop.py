"""
Integration tests for Phone-to-Backend Event Loop and n8n Broker Integration.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_phone_event_golden_flow(client):
    """
    Test the complete golden path:
    Phone Client -> [n8n Broker Forwarding] -> FastAPI /phone-trigger -> LangGraph Recovery.
    """
    # 1. Reset state to golden seed
    reset_res = client.post("/api/v1/warehouse/reset", json={"seed": 42})
    assert reset_res.status_code == 200

    # 2. Simulate sanitized payload produced by n8n Code node from phone event
    n8n_sanitized_payload = {
        "event_type": "robot_failure",
        "robot_id": "R04",
        "source": "iqoo_phone",
        "notes": "Voice trigger from mobile operator: 'Robot R04 has stalled'",
        "timestamp": "2026-09-01T15:40:00Z"
    }

    # 3. Post to FastAPI phone-trigger endpoint
    res = client.post("/api/v1/events/phone-trigger", json=n8n_sanitized_payload)
    assert res.status_code == 200
    data = res.json()

    # 4. Verify that LangGraph ran and returned valid recovery
    assert data["status"] == "RECOVERY_EXECUTED"
    assert data["failed_robot_id"] == "R04"
    assert data["selected_robot_id"] == "R07"
    assert data["validation_passed"] is True
    assert "O104" in data["affected_orders"]
    assert "key_factors" in data["explanation"]

    # 5. Verify warehouse state reflects recovery
    state_res = client.get("/api/v1/warehouse/state")
    assert state_res.status_code == 200
    state = state_res.json()

    # R04 is FAILED
    assert state["robots"]["R04"]["status"] == "FAILED"
    # R07 is RECOVERING and assigned to O104
    assert state["robots"]["R07"]["status"] == "RECOVERING"
    assert state["robots"]["R07"]["assigned_order_id"] == "O104"
    # O104 is recovered back to IN_PROGRESS
    assert state["orders"]["O104"]["status"] == "IN_PROGRESS"


def test_phone_event_dynamic_robot_selection(client):
    """
    Verify that the phone client can dynamically break any robot (e.g. R02),
    and the backend computes genuine candidate scoring without hardcoding R04 or R07.
    """
    # Reset
    client.post("/api/v1/warehouse/reset", json={"seed": 42})

    # Trigger failure on R02 via phone
    phone_payload = {
        "event_type": "robot_failure",
        "robot_id": "R02",
        "source": "iqoo_phone",
        "notes": "Tactile tap on R02"
    }

    res = client.post("/api/v1/events/phone-trigger", json=phone_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "RECOVERY_EXECUTED"
    assert data["failed_robot_id"] == "R02"
    assert data["validation_passed"] is True
    # Replacement robot should NOT be R02 and should be selected dynamically
    assert data["selected_robot_id"] != "R02"
    assert data["selected_robot_id"] in ["R01", "R03", "R05", "R07", "R08", "R09", "R10", "R11", "R12"]


def test_phone_event_invalid_robot_handling(client):
    """
    Verify that an invalid robot ID returns 404 cleanly.
    """
    invalid_payload = {
        "event_type": "robot_failure",
        "robot_id": "R99_UNKNOWN",
        "source": "iqoo_phone"
    }
    res = client.post("/api/v1/events/phone-trigger", json=invalid_payload)
    assert res.status_code == 404
