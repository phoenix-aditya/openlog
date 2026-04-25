from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DraftUpsert(BaseModel):
    title: str
    content: str


class DraftResponse(BaseModel):
    id: UUID
    title: str
    updated_at: datetime

    class Config:
        from_attributes = True


class DraftDetailResponse(BaseModel):
    id: UUID
    title: str
    content: str
    updated_at: datetime

    class Config:
        from_attributes = True


class DraftListItem(BaseModel):
    id: UUID
    title: str
    updated_at: datetime

    class Config:
        from_attributes = True
