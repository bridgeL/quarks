import json
import secrets
import time

from loguru import logger
from app.entities.room_entity import RoomEntity
from app.services.ws_service import ws_manager
from app.utils.id_generator import generate_id

_ROOM_ADJECTIVES = [
    "敏捷的", "勇敢的", "智慧的", "快乐的", "宁静的",
    "灿烂的", "温柔的", "热情的", "冷静的", "神秘的",
    "古老的", "未来的", "遥远的", "华丽的", "深邃的",
    "轻盈的", "坚定的", "活泼的", "浪漫的", "传奇的",
]

_ROOM_NOUNS = [
    "星辰", "月光", "火焰", "海洋", "山峰",
    "森林", "沙漠", "极光", "风暴", "晨曦",
    "暮色", "彩虹", "巨石", "湖泊", "云海",
    "飞鸟", "游鱼", "雄狮", "飞龙", "凤凰",
]


def _generate_room_name() -> str:
    adj = secrets.choice(_ROOM_ADJECTIVES)
    noun = secrets.choice(_ROOM_NOUNS)
    return f"{adj}{noun}"


class RoomServer:
    def __init__(self):
        self._rooms: dict[str, RoomEntity] = {}
        self._user_rooms: dict[str, str] = {}

    def create_room(self, room_id: str, created_by: str, name: str | None = None) -> RoomEntity:
        room_name = name.strip() if name and name.strip() else _generate_room_name()
        room = RoomEntity(
            room_id=room_id,
            name=room_name,
            created_by=created_by,
            created_at=int(time.time() * 1000),
            status="preparing",
            users=[],
        )
        self._rooms[room_id] = room
        return room

    def get_room(self, room_id: str) -> RoomEntity | None:
        return self._rooms.get(room_id)

    def list_rooms(self) -> list[RoomEntity]:
        return [r for r in self._rooms.values() if r.users]

    def join_room(self, room_id: str, user_id: str) -> RoomEntity | None:
        room = self._rooms.get(room_id)
        if not room:
            return None
        if user_id not in room.users:
            room.users.append(user_id)
        self._user_rooms[user_id] = room_id
        return room

    def leave_room(self, user_id: str) -> str | None:
        room_id = self._user_rooms.pop(user_id, None)
        if room_id:
            room = self._rooms.get(room_id)
            if room and user_id in room.users:
                room.users.remove(user_id)
            if not room.users:
                self._rooms.pop(room_id, None)
        return room_id

    def get_user_room(self, user_id: str) -> str | None:
        return self._user_rooms.get(user_id)

    def get_room_users(self, room_id: str) -> list[str]:
        room = self._rooms.get(room_id)
        return list(room.users) if room else []

    async def broadcast_to_room(self, room_id: str, message: str, exclude_user_id: str | None = None):
        room = self._rooms.get(room_id)
        if not room:
            return
        logger.info(f"WS room broadcast >>> [{room_id}] {message[:100]}")
        for uid in room.users:
            if uid == exclude_user_id:
                continue
            await ws_manager.send_personal(message, uid)


room_server = RoomServer()
