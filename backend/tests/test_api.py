"""
FastAPI End-to-End REST API and Event Integration Tests.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_api_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "NeuroWarehouse"
    assert data["tagline"] == "BREAK IT. WATCH IT HEAL. SEE WHY."


def test_api_warehouse_state(client):
    response = client.get("/api/v1/warehouse/state")
    assert response.status_code == 200
    data = response.json()
    assert "robots" in data
    assert "shelves" in data
    assert "orders" in data
    assert len(data["robots"]) == 12


def test_api_warehouse_reset(client):
    response = client.post("/api/v1/warehouse/reset", json={"seed": 42})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "RESET_OK"
    assert data["kpis"]["failed_robots"] == 0


def test_api_robot_failure_and_recovery(client):
    # First reset
    client.post("/api/v1/warehouse/reset", json={"seed": 42})

    # Trigger failure on R04
    response = client.post(
        "/api/v1/events/robot-failure",
        json={"robot_id": "R04", "source": "test_dashboard"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "RECOVERY_EXECUTED"
    assert data["failed_robot_id"] == "R04"
    assert data["selected_robot_id"] == "R07"
    assert data["validation_passed"] is True
    assert "explanation" in data
    assert len(data["explanation"]["key_factors"]) > 0

    # Verify latest decision retrieval
    dec_res = client.get("/api/v1/decisions/latest")
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["selected_robot_id"] == "R07"


def test_api_phone_trigger(client):
    # Reset
    client.post("/api/v1/warehouse/reset", json={"seed": 42})

    # Trigger via phone endpoint
    response = client.post(
        "/api/v1/events/phone-trigger",
        json={
            "event_type": "robot_failure",
            "robot_id": "R04",
            "source": "iqoo_phone",
            "notes": "Voice command: R04 stalled"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "RECOVERY_EXECUTED"
    assert data["selected_robot_id"] == "R07"


def test_api_what_if_simulation(client):
    response = client.post(
        "/api/v1/simulation/what-if",
        json={
            "hypothetical_failure_robot_id": "R07",
            "baseline_failed_robot_id": "R04"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["baseline_failed_robot"] == "R04"
    assert data["hypothetical_failed_robot"] == "R07"
    assert data["simulated_selected_robot"] is not None
    assert data["simulated_selected_robot"] not in ["R04", "R07"]
