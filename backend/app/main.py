from contextlib import asynccontextmanager

from app.utils.logging import init_logging

init_logging()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.auth_controller import router as auth_router
from app.controllers.room_controller import router as room_router
from app.controllers.static_controller import router as static_router, register_static
from app.controllers.ws_controller import router as ws_router
from app.db.database import Base, SessionLocal, engine
from app.services.user_service import user_service


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user_service.cleanup_expired_guest_users(db)
        yield
    finally:
        db.close()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ws_router)
app.include_router(room_router)
app.include_router(static_router)
register_static(app)
