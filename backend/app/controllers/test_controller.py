from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.dependencies import get_current_user, get_db
from app.entities.test_entity import TestEntity
from app.entities.user_entity import UserEntity
from app.schemas.test_schema import CreateTestRequest, DeleteTestRequest, NameResponse, UpdateTestRequest
from app.services.test_service import test_service

router = APIRouter(prefix="/test")


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/list", response_model=list[NameResponse])
def list_tests(
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    tests: list[TestEntity] = test_service.list_tests(db)
    return [NameResponse(id=test.id, name=test.name) for test in tests]


@router.post("/create", response_model=NameResponse)
def create_test(
    request: CreateTestRequest,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    test = test_service.create(db, request.name)
    return NameResponse(id=test.id, name=test.name)


@router.post("/update", response_model=NameResponse)
def update_test(
    request: UpdateTestRequest,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    test = test_service.update(db, request.id, request.name)
    if test is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return NameResponse(id=test.id, name=test.name)


@router.post("/delete", response_model=NameResponse)
def delete_test(
    request: DeleteTestRequest,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    test = test_service.delete(db, request.id)
    if test is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return NameResponse(id=test.id, name=test.name)
