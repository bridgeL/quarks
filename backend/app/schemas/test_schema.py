from pydantic import BaseModel


class NameResponse(BaseModel):
    id: str
    name: str


class CreateTestRequest(BaseModel):
    name: str


class UpdateTestRequest(BaseModel):
    id: str
    name: str


class DeleteTestRequest(BaseModel):
    id: str
