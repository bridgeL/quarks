from dataclasses import dataclass, field

from app.entities.game_entity import GameEntity


@dataclass
class RoomEntity:
    room_id: str
    name: str
    created_by: str
    created_at: int
    status: str = "preparing"
    users: list[str] = field(default_factory=list)
    game: GameEntity | None = None
