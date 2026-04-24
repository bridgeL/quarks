from dataclasses import dataclass, field

from app.entities.player_entity import PlayerEntity


@dataclass
class GameEntity:
    game_id: str
    room_id: str
    started_at: int
    players: list[PlayerEntity] = field(default_factory=list)
