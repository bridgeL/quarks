from pydantic import BaseModel


class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class AutoRegisterRequest(BaseModel):
    pass


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