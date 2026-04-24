from pydantic import BaseModel


class CreateRoomRequest(BaseModel):
    name: str | None = None


class RoomUserInfo(BaseModel):
    user_id: str
    username: str
    nickname: str
    is_auto_registered: bool


class RoomPlayerInfo(BaseModel):
    player_id: str
    user_id: str
    username: str
    nickname: str
    is_auto_registered: bool
    left_at: int | None = None


class RoomGameInfo(BaseModel):
    game_id: str
    room_id: str
    started_at: int
    players: list[RoomPlayerInfo]


class RoomResponse(BaseModel):
    room_id: str
    name: str
    created_by: str
    created_at: int
    status: str
    users: list[RoomUserInfo]
    game: RoomGameInfo | None = None


class RoomListItem(BaseModel):
    room_id: str
    name: str
    created_by: str
    created_by_nickname: str
    created_at: int
    user_count: int
    status: str


class CreateRoomResponse(BaseModel):
    room_id: str
    name: str
    created_by: str
    created_at: int
    status: str


class JoinLeaveResponse(BaseModel):
    ok: bool
    room_id: str
