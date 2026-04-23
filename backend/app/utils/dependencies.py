import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.entities.user_entity import UserEntity
from app.utils.constant import JWT_ALGORITHM, JWT_SECRET

security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> UserEntity:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Missing subject")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(UserEntity).filter(UserEntity.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
