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

    def get_ws(self, user_id: str) -> WebSocket | None:
        return self.active_connections.get(user_id)

    async def send_personal(self, message: str, user_id: str):
        ws = self.active_connections.get(user_id)
        if ws:
            logger.info(f"WS >>> [{user_id}] {message}")
            await ws.send_text(message)

    async def broadcast(self, message: str):
        logger.info(f"WS broadcast >>> {len(self.active_connections)} clients: {message}")
        for ws in self.active_connections.values():
            await ws.send_text(message)

    async def broadcast_except(self, message: str, except_user_id: str):
        logger.info(f"WS broadcast >>> except {except_user_id}: {message}")
        for user_id, ws in self.active_connections.items():
            if user_id != except_user_id:
                await ws.send_text(message)


ws_manager = ConnectionManager()
