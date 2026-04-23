from fastapi import WebSocket
from loguru import logger


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)

    async def send_personal(self, message: str, user_id: str):
        ws = self.active_connections.get(user_id)
        if ws:
            await ws.send_text(message)

    async def broadcast(self, message: str):
        logger.debug(f"WS broadcast to {len(self.active_connections)} clients: {message[:100]}")
        for ws in self.active_connections.values():
            await ws.send_text(message)

    async def broadcast_except(self, message: str, except_user_id: str):
        logger.debug(f"WS broadcast except {except_user_id}: {message[:100]}")
        for user_id, ws in self.active_connections.items():
            if user_id != except_user_id:
                await ws.send_text(message)


ws_manager = ConnectionManager()
