import hashlib
import secrets
import string
from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy.orm import Session

from app.entities.user_entity import UserEntity
from app.services.snowflake import snowflake
from app.utils.constant import JWT_ALGORITHM, JWT_EXPIRE_HOURS, JWT_SECRET


class UserService:
    def create_token(self, user_id: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
        payload = {"sub": user_id, "exp": expire}
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def _generate_salt(self) -> str:
        return secrets.token_hex(16)

    def _hash_password(self, password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def _verify_password(self, user: UserEntity, password: str) -> bool:
        return self._hash_password(password, user.salt) == user.password_hash

    def _set_password(self, user: UserEntity, password: str) -> None:
        salt = self._generate_salt()
        user.salt = salt
        user.password_hash = self._hash_password(password, salt)

    def register(self, db: Session, username: str, password: str, nickname: str | None = None) -> tuple[UserEntity | None, str | None]:
        existing = db.query(UserEntity).filter(UserEntity.username == username).first()
        if existing:
            return None, "Username already exists"

        user = UserEntity(
            id=snowflake.generate(),
            username=username,
            nickname=nickname or username,
            password_hash="",
            salt="",
        )
        self._set_password(user, password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, None

    def verify(self, db: Session, username: str, password: str) -> UserEntity | None:
        user = db.query(UserEntity).filter(UserEntity.username == username).first()
        if not user:
            return None

        if not self._verify_password(user, password):
            return None

        return user

    def _generate_guest_username(self, db: Session) -> str:
        alphabet = string.ascii_letters + string.digits
        while True:
            username = ''.join(secrets.choice(alphabet) for _ in range(6))
            existing = db.query(UserEntity).filter(UserEntity.username == username).first()
            if not existing:
                return username

    def auto_register(self, db: Session, nickname: str | None = None) -> UserEntity:
        username = self._generate_guest_username(db)
        password = secrets.token_hex(16)

        user = UserEntity(
            id=snowflake.generate(),
            username=username,
            nickname=nickname or username,
            password_hash="",
            salt="",
            is_auto_registered=True,
        )
        self._set_password(user, password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update_current_user(
        self,
        db: Session,
        user: UserEntity,
        nickname: str | None,
        password: str | None,
        old_password: str | None,
    ) -> tuple[UserEntity | None, str | None]:
        updated = False

        if nickname is not None:
            user.nickname = nickname
            updated = True

        if password is not None:
            if user.is_auto_registered:
                self._set_password(user, password)
                user.is_auto_registered = False
                updated = True
            else:
                if old_password is None:
                    return None, "Old password is required"
                if not self._verify_password(user, old_password):
                    return None, "Old password is incorrect"
                self._set_password(user, password)
                updated = True

        if not updated:
            return None, "Nothing to update"

        db.commit()
        db.refresh(user)
        return user, None


user_service = UserService()
