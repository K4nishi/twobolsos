from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    """
    Manages WebSocket connections for real-time updates.
    Maps user_id to a list of active WebSocket connections,
    allowing users to be connected from multiple devices.
    """
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        """Remove a WebSocket connection when it closes."""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        """Send a message to all connections of a specific user."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    pass

    async def broadcast_to_wallet(self, message: str, user_ids: List[int]):
        """Broadcast a message to all members of a wallet."""
        for uid in user_ids:
            await self.send_personal_message(message, uid)

manager = ConnectionManager()
