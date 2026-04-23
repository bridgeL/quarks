import hashlib
import secrets

from sqlalchemy.orm import Session

from app.entities.user_entity import UserEntity
from app.services.snowflake import snowflake


class UserService:
    def register(self, db: Session, username: str, password: str) -> tuple[UserEntity | None, str | None]:
        existing = db.query(UserEntity).filter(UserEntity.username == username).first()
        if existing:
            return None, "Username already exists"

        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()

        user = UserEntity(
            id=snowflake.generate(),
            username=username,
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