import json

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from app.entities.game_entity import GameEntity
from app.entities.player_entity import PlayerEntity
from app.entities.user_entity import UserEntity
from app.schemas.room_schema import (
    CreateRoomRequest,
    CreateRoomResponse,
    JoinLeaveResponse,
    RoomGameInfo,
    RoomListItem,
    RoomPlayerInfo,
    RoomResponse,
    RoomUserInfo,
)
from app.services.room_server import room_server
from app.utils.dependencies import get_current_user, get_db
from app.utils.id_generator import generate_id

router = APIRouter(prefix="/room")


def _room_user_info(user: UserEntity) -> RoomUserInfo:
    return RoomUserInfo(
        user_id=str(user.id),
        username=user.username,
        nickname=user.nickname,
        is_auto_registered=user.is_auto_registered,
    )


def _player_to_response(player: PlayerEntity, db: Session) -> RoomPlayerInfo | None:
    user = db.query(UserEntity).filter(UserEntity.id == player.user_id).first()
    if not user:
        return None
    return RoomPlayerInfo(
        player_id=player.player_id,
        user_id=player.user_id,
        username=user.username,
        nickname=user.nickname,
        is_auto_registered=user.is_auto_registered,
        left_at=player.left_at,
    )


def _game_to_response(game: GameEntity, db: Session) -> RoomGameInfo:
    players: list[RoomPlayerInfo] = []
    for player in game.players:
        player_info = _player_to_response(player, db)
        if player_info:
            players.append(player_info)
    return RoomGameInfo(
        game_id=game.game_id,
        room_id=game.room_id,
        started_at=game.started_at,
        players=players,
    )


def _room_to_response(room_id: str, db: Session) -> RoomResponse | None:
    room = room_server.get_room(room_id)
    if not room:
        return None

    users: list[RoomUserInfo] = []
    for uid in room.users:
        user = db.query(UserEntity).filter(UserEntity.id == uid).first()
        if user:
            users.append(_room_user_info(user))

    game = _game_to_response(room.game, db) if room.game else None

    return RoomResponse(
        room_id=room.room_id,
        name=room.name,
        created_by=room.created_by,
        created_at=room.created_at,
        status=room.status,
        users=users,
        game=game,
    )


@router.post("/create", response_model=CreateRoomResponse)
def create_room(
    request: CreateRoomRequest,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"POST /room/create request: name={request.name}, user_id={current_user.id}")
    room_id = generate_id(6)
    room = room_server.create_room(room_id, current_user.id, request.name)
    response = CreateRoomResponse(
        room_id=room.room_id,
        name=room.name,
        created_by=room.created_by,
        created_at=room.created_at,
        status=room.status,
    )
    logger.info(f"POST /room/create response: {response}")
    return response


@router.get("/list", response_model=list[RoomListItem])
def list_rooms(
    db: Session = Depends(get_db),
):
    logger.info("GET /room/list request")
    items = []
    for room in room_server.list_rooms():
        creator = db.query(UserEntity).filter(UserEntity.id == room.created_by).first()
        items.append(RoomListItem(
            room_id=room.room_id,
            name=room.name,
            created_by=room.created_by,
            created_by_nickname=creator.nickname if creator else room.created_by,
            created_at=room.created_at,
            user_count=len(room.users),
            status=room.status,
        ))
    response = items
    logger.info(f"GET /room/list response: {response}")
    return response


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"GET /room/{room_id} request: user_id={current_user.id}")
    response = _room_to_response(room_id, db)
    if not response:
        raise HTTPException(status_code=404, detail="Room not found")
    logger.info(f"GET /room/{room_id} response: {response}")
    return response


@router.post("/{room_id}/join", response_model=JoinLeaveResponse)
async def join_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"POST /room/{room_id}/join request: user_id={current_user.id}")
    existing = room_server.get_room(room_id)
    if not existing:
        raise HTTPException(status_code=404, detail="房间不存在")
    if existing.status == "playing":
        raise HTTPException(status_code=400, detail="房间已开始游戏，无法加入")
    room_server.join_room(room_id, current_user.id)
    await room_server.broadcast_to_room(
        room_id,
        json.dumps({
            "type": "user_joined",
            "user_id": current_user.id,
            "username": current_user.username,
            "nickname": current_user.nickname,
            "is_auto_registered": current_user.is_auto_registered,
        }),
        exclude_user_id=current_user.id,
    )
    response = JoinLeaveResponse(ok=True, room_id=room_id)
    logger.info(f"POST /room/{room_id}/join response: {response}")
    return response


@router.post("/{room_id}/leave", response_model=JoinLeaveResponse)
async def leave_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"POST /room/{room_id}/leave request: user_id={current_user.id}")
    room_id_left = room_server.leave_room(current_user.id)
    msg = json.dumps({"type": "user_left", "user_id": current_user.id})
    if room_id_left:
        await room_server.broadcast_to_room(room_id_left, msg)
    response = JoinLeaveResponse(ok=True, room_id=room_id)
    logger.info(f"POST /room/{room_id}/leave response: {response}")
    return response


@router.post("/{room_id}/start")
async def start_game(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"POST /room/{room_id}/start request: user_id={current_user.id}")
    ok, err = room_server.start_game(room_id)
    if not ok:
        raise HTTPException(status_code=400, detail=err)
    room = room_server.get_room(room_id)
    await room_server.broadcast_to_room(room_id, json.dumps({"type": "game_started", "room_id": room_id}))
    logger.info(f"POST /room/{room_id}/start response: ok=True")
    return {"ok": True, "room_id": room_id, "status": room.status if room else ""}


@router.post("/{room_id}/end")
async def end_game(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"POST /room/{room_id}/end request: user_id={current_user.id}")
    ok, err = room_server.end_game(room_id)
    if not ok:
        raise HTTPException(status_code=400, detail=err)
    room = room_server.get_room(room_id)
    await room_server.broadcast_to_room(room_id, json.dumps({"type": "game_ended", "room_id": room_id}))
    logger.info(f"POST /room/{room_id}/end response: ok=True")
    return {"ok": True, "room_id": room_id, "status": room.status if room else ""}
