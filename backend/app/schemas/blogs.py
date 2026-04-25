from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TagResponse(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True


class BlogCreate(BaseModel):
    draft_id: UUID
    tags: list[str] = []


class BlogUpdate(BaseModel):
    title: str
    content: str
    tags: list[str] = []


class BlogResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    author_username: str
    tags: list[TagResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class BlogDetailResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    author_username: str
    content: str
    tags: list[TagResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class BlogListItem(BaseModel):
    id: UUID
    title: str
    slug: str
    created_at: datetime
    tags: list[TagResponse]

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str

    class Config:
        from_attributes = True
