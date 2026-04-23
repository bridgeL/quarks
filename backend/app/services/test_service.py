from sqlalchemy.orm import Session

from app.entities.test_entity import TestEntity
from app.services.snowflake import snowflake


class TestService:
    def list_tests(self, db: Session) -> list[TestEntity]:
        return db.query(TestEntity).all()

    def create(self, db: Session, name: str) -> TestEntity:
        test = TestEntity(id=snowflake.generate(), name=name)
        db.add(test)
        db.commit()
        db.refresh(test)
        return test

    def update(self, db: Session, test_id: str, name: str) -> TestEntity | None:
        test = db.query(TestEntity).filter(TestEntity.id == test_id).first()
        if test is None:
            return None
        test.name = name
        db.commit()
        db.refresh(test)
        return test

    def delete(self, db: Session, test_id: str) -> TestEntity | None:
        test = db.query(TestEntity).filter(TestEntity.id == test_id).first()
        if test is None:
            return None
        db.delete(test)
        db.commit()
        return test


test_service = TestService()
