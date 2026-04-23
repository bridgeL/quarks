from pydantic import BaseModel


class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class AutoRegisterRequest(BaseModel):
    nickname: str | None = None


class UpdateCurrentUserRequest(BaseModel):
    nickname: str | None = None
    old_password: str | None = None
    password: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    username: str
    nickname: str
    token_type: str = "bearer"


class AutoRegisterResponse(BaseModel):
    access_token: str
    username: str
    nickname: str
    token_type: str = "bearer"


class CurrentUserResponse(BaseModel):
    id: str
    username: str
    nickname: str
    is_auto_registered: bool
