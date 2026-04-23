from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from app.utils.dependencies import get_current_user, get_db
from app.entities.test_entity import TestEntity
from app.entities.user_entity import UserEntity
from app.schemas.test_schema import CreateTestRequest, DeleteTestRequest, NameResponse, UpdateTestRequest
from app.services.test_service import test_service

router = APIRouter(prefix="/test")


@router.get("/health")
def health():
    logger.info("GET /test/health request")
    response = {"status": "ok"}
    logger.info(f"GET /test/health response: {response}")
    return response


@router.get("/list", response_model=list[NameResponse])
def list_tests(
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"GET /test/list request: user_id={current_user.id}")
    tests: list[TestEntity] = test_service.list_tests(db, current_user.id)
    response = [NameResponse(id=test.id, name=test.name) for test in tests]
    logger.info(f"GET /test/list response: {response}")
    return response


@router.post("/create", response_model=NameResponse)
def create_test(
    request: CreateTestRequest,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"POST /test/create request: {request}, user_id={current_user.id}")
    test = test_service.create(db, current_user.id, request.name)
    response = NameResponse(id=test.id, name=test.name)
    logger.info(f"POST /test/create response: {response}")
    return response


@router.post("/update", response_model=NameResponse)
def update_test(
    request: UpdateTestRequest,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"POST /test/update request: {request}, user_id={current_user.id}")
    test = test_service.update(db, current_user.id, request.id, request.name)
    if test is None:
        raise HTTPException(status_code=404, detail="Data not found")
    response = NameResponse(id=test.id, name=test.name)
    logger.info(f"POST /test/update response: {response}")
    return response


@router.post("/delete", response_model=NameResponse)
def delete_test(
    request: DeleteTestRequest,
    db: Session = Depends(get_db),
    current_user: UserEntity = Depends(get_current_user),
):
    logger.info(f"POST /test/delete request: {request}, user_id={current_user.id}")
    test = test_service.delete(db, current_user.id, request.id)
    if test is None:
        raise HTTPException(status_code=404, detail="Data not found")
    response = NameResponse(id=test.id, name=test.name)
    logger.info(f"POST /test/delete response: {response}")
    return response
