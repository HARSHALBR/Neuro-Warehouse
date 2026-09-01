"""
WebSocket Connection Manager and Real-Time Event Broadcaster for NeuroWarehouse.
"""
from typing import List, Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging

logger = logging.getLogger("neurowarehouse.websocket")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast_json(self, data: Dict[str, Any]):
        """Broadcasts a JSON message to all active WebSocket clients."""
        if not self.active_connections:
            return

        dead_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception as e:
                logger.debug(f"Failed to send to client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

    async def broadcast_agent_step(self, agent: str, step: str, message: str, payload: Optional[Dict[str, Any]] = None):
        """Broadcasts agent thought stream updates for live UI badges."""
        event = {
            "type": "AGENT_STEP",
            "agent": agent,
            "step": step,
            "message": message,
            "payload": payload or {}
        }
        await self.broadcast_json(event)


ws_manager = ConnectionManager()
