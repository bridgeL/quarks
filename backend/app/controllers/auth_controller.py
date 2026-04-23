from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db
from app.schemas.user_schema import AutoRegisterResponse, LoginRequest, RegisterRequest, TokenResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/auth")
service = UserService()


@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    user, error = service.register(db, request.username, request.password, request.nickname)
    if error:
        raise HTTPException(status_code=400, detail=error)
    token = service.create_token(user.id)
    return TokenResponse(access_token=token, username=user.username, nickname=user.nickname)


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = service.verify(db, request.username, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = service.create_token(user.id)
    return TokenResponse(access_token=token, username=user.username, nickname=user.nickname)


@router.post("/auto-register", response_model=AutoRegisterResponse)
def auto_register(db: Session = Depends(get_db)):
    user = service.auto_register(db)
    token = service.create_token(user.id)
    return AutoRegisterResponse(access_token=token, username=user.username, nickname=user.nickname)
