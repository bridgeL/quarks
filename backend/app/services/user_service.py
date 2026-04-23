import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy.orm import Session

from app.entities.user_entity import UserEntity
from app.services.snowflake import snowflake
from app.utils.constant import JWT_ALGORITHM, JWT_EXPIRE_HOURS, JWT_SECRET


class UserService:
    def create_token(self, user_id: int) -> str:
        expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
        payload = {"sub": str(user_id), "exp": expire}
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def register(self, db: Session, username: str, password: str, nickname: str | None = None) -> tuple[UserEntity | None, str | None]:
        existing = db.query(UserEntity).filter(UserEntity.username == username).first()
        if existing:
            return None, "Username already exists"

        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()

        user = UserEntity(
            id=snowflake.generate(),
            username=username,
            nickname=nickname or username,
            password_hash=password_hash,
            salt=salt,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, None

    def verify(self, db: Session, username: str, password: str) -> UserEntity | None:
        user = db.query(UserEntity).filter(UserEntity.username == username).first()
        if not user:
            return None

        password_hash = hashlib.sha256((password + user.salt).encode()).hexdigest()
        if password_hash != user.password_hash:
            return None

        return user

    def auto_register(self, db: Session) -> UserEntity:
        username = secrets.token_hex(8)
        password = secrets.token_hex(16)
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()

        user = UserEntity(
            id=snowflake.generate(),
            username=username,
            nickname=username,
            password_hash=password_hash,
            salt=salt,
            is_auto_registered=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user