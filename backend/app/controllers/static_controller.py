from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

DIST_DIR = Path(__file__).resolve().parents[2] / 'dist'
INDEX_FILE = DIST_DIR / 'index.html'
ASSETS_DIR = DIST_DIR / 'assets'

router = APIRouter()


@router.get('/')
def serve_index():
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=404, detail='Frontend build not found in backend/dist')
    return FileResponse(INDEX_FILE)


@router.get('/{full_path:path}')
def serve_spa(full_path: str):
    if full_path.startswith('auth/') or full_path.startswith('test/') or full_path.startswith('assets/') or full_path.startswith('ws/'):
        raise HTTPException(status_code=404, detail='Not found')
    if not INDEX_FILE.exists():
        raise HTTPException(status_code=404, detail='Frontend build not found in backend/dist')
    return FileResponse(INDEX_FILE)


def register_static(app):
    if ASSETS_DIR.exists():
        app.mount('/assets', StaticFiles(directory=ASSETS_DIR), name='assets')
