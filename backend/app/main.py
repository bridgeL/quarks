from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.test_controller import router as test_router
from app.db.database import Base, engine

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
app.include_router(test_router)
