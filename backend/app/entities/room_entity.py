from dataclasses import dataclass, field


@dataclass
class RoomEntity:
    room_id: str
    name: str
    created_by: str
    created_at: int
    status: str = "preparing"
    users: list[str] = field(default_factory=list)
