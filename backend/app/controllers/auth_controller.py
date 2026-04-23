from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from app.entities.user_entity import UserEntity
from app.schemas.user_schema import (
    AutoRegisterRequest,
    AutoRegisterResponse,
    CurrentUserResponse,
    LoginRequest,
    TokenResponse,
    UpdateCurrentUserRequest,
)
from app.services.user_service import user_service
from app.utils.dependencies import get_current_user, get_db

router = APIRouter(prefix="/auth")


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    logger.info(f"POST /auth/login request: {request}")
    user = user_service.verify(db, request.username, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = user_service.create_token(user.id)
    response = TokenResponse(access_token=token, username=user.username, nickname=user.nickname)
    logger.info(f"POST /auth/login response: {response}")
    return response


@router.post("/auto-register", response_model=AutoRegisterResponse)
def auto_register(request: AutoRegisterRequest, db: Session = Depends(get_db)):
    logger.info(f"POST /auth/auto-register request: {request}")
    user = user_service.auto_register(db, request.nickname)
    token = user_service.create_token(user.id)
    response = AutoRegisterResponse(access_token=token, username=user.username, nickname=user.nickname)
    logger.info(f"POST /auth/auto-register response: {response}")
    return response


@router.get("/ping")
def ping(current_user: UserEntity = Depends(get_current_user)):
    logger.info(f"GET /auth/ping request: user_id={current_user.id}")
    return {"ok": True}


@router.get("/me", response_model=CurrentUserResponse)
def get_current_user_profile(current_user: UserEntity = Depends(get_current_user)):
    logger.info(f"GET /auth/me request: user_id={current_user.id}")
    response = CurrentUserResponse(
        id=current_user.id,
        username=current_user.username,
        nickname=current_user.nickname,
        is_auto_registered=current_user.is_auto_registered,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at,
    )
    logger.info(f"GET /auth/me response: {response}")
    return response


@router.get("/clean-guest")
def clean_guest_users(db: Session = Depends(get_db)):
    logger.info("GET /auth/clean-guest request")
    deleted_count = user_service.cleanup_expired_guest_users(db)
    response = {"deleted_count": deleted_count}
    logger.info(f"GET /auth/clean-guest response: {response}")
    return response


@router.post("/update", response_model=CurrentUserResponse)
def update_current_user_profile(
    request: UpdateCurrentUserRequest,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"POST /auth/update request: {request}, user_id={current_user.id}")
    user, error = user_service.update_current_user(
        db,
        current_user,
        request.nickname,
        request.password,
        request.old_password,
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    response = CurrentUserResponse(
        id=user.id,
        username=user.username,
        nickname=user.nickname,
        is_auto_registered=user.is_auto_registered,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )
    logger.info(f"POST /auth/update response: {response}")
    return response
