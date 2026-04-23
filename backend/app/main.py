from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.controllers.auth_controller import router as auth_router
from app.controllers.test_controller import router as test_router
from app.db.database import Base, SessionLocal, engine
from app.services.user_service import user_service

DIST_DIR = Path(__file__).resolve().parents[1] / 'dist'
INDEX_FILE = DIST_DIR / 'index.html'
ASSETS_DIR = DIST_DIR / 'assets'


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
app.include_router(test_router)

if ASSETS_DIR.exists():
    app.mount('/assets', StaticFiles(directory=ASSETS_DIR), name='assets')


@app.get('/')
def serve_index():
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=404, detail='Frontend build not found in backend/dist')
    return FileResponse(INDEX_FILE)


@app.get('/{full_path:path}')
def serve_spa(full_path: str):
    if full_path.startswith('auth/') or full_path.startswith('test/') or full_path.startswith('assets/'):
        raise HTTPException(status_code=404, detail='Not found')
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=404, detail='Frontend build not found in backend/dist')
    return FileResponse(INDEX_FILE)
