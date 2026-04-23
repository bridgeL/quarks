from sqlalchemy.orm import Session

from app.entities.test_entity import TestEntity
from app.utils.snowflake import snowflake


class TestService:
    def list_tests(self, db: Session, user_id: str) -> list[TestEntity]:
        return db.query(TestEntity).filter(TestEntity.user_id == user_id).all()

    def create(self, db: Session, user_id: str, name: str) -> TestEntity:
        test = TestEntity(id=snowflake.generate(), name=name, user_id=user_id)
        db.add(test)
        db.commit()
        db.refresh(test)
        return test

    def update(self, db: Session, user_id: str, test_id: str, name: str) -> TestEntity | None:
        test = db.query(TestEntity).filter(TestEntity.id == test_id, TestEntity.user_id == user_id).first()
        if test is None:
            return None
        test.name = name
        db.commit()
        db.refresh(test)
        return test

    def delete(self, db: Session, user_id: str, test_id: str) -> TestEntity | None:
        test = db.query(TestEntity).filter(TestEntity.id == test_id, TestEntity.user_id == user_id).first()
        if test is None:
            return None
        db.delete(test)
        db.commit()
        return test


test_service = TestService()
