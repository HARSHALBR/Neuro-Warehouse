"""
NeuroWarehouse Backend Configuration.
"""
import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "NeuroWarehouse"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Grid Dimensions
    GRID_WIDTH: int = 30
    GRID_HEIGHT: int = 20
    SIMULATION_TICK_HZ: int = 10

    # LLM Settings
    # Modes: "ollama", "gemini", "heuristic_fallback"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "gemma3:4b")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Candidate Scoring Weights
    WEIGHT_BATTERY: float = 0.35
    WEIGHT_DISTANCE: float = 0.35
    WEIGHT_CONGESTION: float = 0.20
    WEIGHT_WORKLOAD: float = 0.10
    MIN_BATTERY_THRESHOLD: float = 15.0


settings = Settings()
