from pydantic import BaseModel


class CreateRoomRequest(BaseModel):
    name: str | None = None


class RoomUserInfo(BaseModel):
    user_id: str
    username: str
    nickname: str
    is_auto_registered: bool


class RoomResponse(BaseModel):
    room_id: str
    name: str
    created_by: str
    created_at: int
    status: str
    users: list[RoomUserInfo]


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
