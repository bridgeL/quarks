import asyncio
import json
import time

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from app.db.database import SessionLocal
from app.entities.user_entity import UserEntity
from app.services.ws_service import ws_manager
from app.utils.constant import JWT_ALGORITHM, JWT_SECRET

router = APIRouter()

HEARTBEAT_INTERVAL = 30  # seconds
HEARTBEAT_TIMEOUT = 40  # seconds


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

    last_activity = time.monotonic()
    heartbeat_task = asyncio.create_task(_heartbeat_loop(websocket, user_id, lambda: last_activity))

    try:
        while True:
            data = await websocket.receive_text()
            last_activity = time.monotonic()
            try:
                msg = json.loads(data)
                if msg.get("type") == "pong":
                    # Pong received, heartbeat will reset its timer via the closure
                    pass
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        logger.debug(f"WS disconnected: user_id={user_id}")
    finally:
        heartbeat_task.cancel()
        ws_manager.disconnect(user_id)
        logger.info(f"WS cleanup done: user_id={user_id}")


async def _heartbeat_loop(websocket: WebSocket, user_id: str, get_last_activity: callable):
    try:
        while True:
            await asyncio.sleep(HEARTBEAT_INTERVAL)
            elapsed = time.monotonic() - get_last_activity()
            if elapsed > HEARTBEAT_TIMEOUT:
                logger.warning(f"WS heartbeat timeout: user_id={user_id}, elapsed={elapsed:.1f}s")
                break
            try:
                await websocket.send_text(json.dumps({"type": "ping"}))
            except Exception:
                break
    except asyncio.CancelledError:
        pass
    except Exception:
        pass
