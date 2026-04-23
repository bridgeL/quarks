import json

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from app.db.database import SessionLocal
from app.entities.user_entity import UserEntity
from app.services.ws_service import ws_manager
from app.utils.constant import JWT_ALGORITHM, JWT_SECRET

router = APIRouter()


async def validate_ws_token(token: str) -> UserEntity | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
    except Exception:
        return None

    db = SessionLocal()
    try:
        user = db.query(UserEntity).filter(UserEntity.id == user_id).first()
        return user
    finally:
        db.close()


@router.websocket("/ws/connect")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        logger.warning("WS connection rejected: missing token")
        await websocket.close(code=4001, reason="Missing token")
        return

    user = await validate_ws_token(token)
    if not user:
        logger.warning("WS connection rejected: invalid or expired token")
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    user_id = str(user.id)
    logger.info(f"WS connected: user_id={user_id}")
    await ws_manager.connect(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"WS <<< [{user_id}] {data}")
            msg = json.loads(data)
            if msg.get("type") == "ping":
                pong = json.dumps({"type": "pong"})
                logger.info(f"WS >>> [{user_id}] {pong}")
                await websocket.send_text(pong)
    except WebSocketDisconnect:
        logger.debug(f"WS disconnected: user_id={user_id}")
    finally:
        ws_manager.disconnect(user_id)
        logger.info(f"WS cleanup done: user_id={user_id}")
