from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas.blogs import BlogCreate, BlogDetailResponse, BlogListItem, BlogResponse, BlogUpdate
from app.services import blog_service

router = APIRouter(prefix="/blogs", tags=["blogs"])


def _to_blog_response(blog, author_username: str) -> BlogResponse:
    return BlogResponse(
        id=blog.id,
        title=blog.title,
        slug=blog.slug,
        author_username=author_username,
        tags=[bt.tag for bt in blog.blog_tags],
        created_at=blog.created_at,
    )


@router.post("", response_model=BlogResponse, status_code=201)
def publish_blog(
    body: BlogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blog = blog_service.publish(db, draft_id=body.draft_id, user_id=current_user.id, tags=body.tags)
    return _to_blog_response(blog, current_user.username)


# NOTE: /id/{blog_id} MUST come before /{slug} to prevent FastAPI matching "id" as a slug
@router.get("/id/{blog_id}", response_model=BlogDetailResponse)
def get_blog_by_id(
    blog_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blog = blog_service.get_blog_for_edit(db, blog_id=blog_id, user_id=current_user.id)
    content = blog_service.get_blog_content(db, blog)
    return BlogDetailResponse(
        id=blog.id,
        title=blog.title,
        slug=blog.slug,
        author_username=current_user.username,
        content=content,
        tags=[bt.tag for bt in blog.blog_tags],
        created_at=blog.created_at,
    )


@router.get("/{slug}", response_model=BlogDetailResponse)
def get_blog(slug: str, username: str, db: Session = Depends(get_db)):
    blog, content = blog_service.get_blog(db, slug=slug, username=username)
    return BlogDetailResponse(
        id=blog.id,
        title=blog.title,
        slug=blog.slug,
        author_username=username,
        content=content,
        tags=[bt.tag for bt in blog.blog_tags],
        created_at=blog.created_at,
    )


@router.get("", response_model=list[BlogListItem])
def list_blogs(username: str, db: Session = Depends(get_db)):
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


@router.put("/{blog_id}", response_model=BlogResponse)
def update_blog(
    blog_id: UUID,
    body: BlogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blog = blog_service.update_blog(
        db,
        blog_id=blog_id,
        user_id=current_user.id,
        title=body.title,
        content=body.content,
        tags=body.tags,
    )
    return _to_blog_response(blog, current_user.username)
