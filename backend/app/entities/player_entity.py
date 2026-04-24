from dataclasses import dataclass


@dataclass
class PlayerEntity:
    player_id: str
    user_id: str
    created_at: int
    left_at: int | None = None
