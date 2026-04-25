from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas.blogs import BlogListItem, UserResponse
from app.services import blog_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/{username}/blogs", response_model=list[BlogListItem])
def get_user_blogs(username: str, db: Session = Depends(get_db)):
    blogs = blog_service.list_blogs_by_user(db, username=username)
    return [
        BlogListItem(
            id=b.id,
            title=b.title,
            slug=b.slug,
            created_at=b.created_at,
            tags=[bt.tag for bt in b.blog_tags],
        )
        for b in blogs
    ]
