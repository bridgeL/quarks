from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.entities.test_entity import TestEntity
from app.schemas.test_schema import CreateTestRequest, DeleteTestRequest, NameResponse, UpdateTestRequest
from app.services.test_service import TestService

router = APIRouter(prefix="/test")
service = TestService()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/list", response_model=list[NameResponse])
def list_tests(db: Session = Depends(get_db)):
    tests: list[TestEntity] = service.list_tests(db)
    return [NameResponse(id=str(test.id), name=test.name) for test in tests]


@router.post("/create", response_model=NameResponse)
def create_test(request: CreateTestRequest, db: Session = Depends(get_db)):
    test = service.create(db, request.name)
    return NameResponse(id=str(test.id), name=test.name)


@router.post("/update", response_model=NameResponse)
def update_test(request: UpdateTestRequest, db: Session = Depends(get_db)):
    test = service.update(db, request.id, request.name)
    if test is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return NameResponse(id=str(test.id), name=test.name)


@router.post("/delete", response_model=NameResponse)
def delete_test(request: DeleteTestRequest, db: Session = Depends(get_db)):
    test = service.delete(db, request.id)
    if test is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return NameResponse(id=str(test.id), name=test.name)
