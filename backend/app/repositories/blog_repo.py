from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Blog


def create(db: Session, user_id: UUID, title: str, slug: str, md_path: str, blog_id: UUID) -> Blog:
    blog = Blog(id=blog_id, user_id=user_id, title=title, slug=slug, md_path=md_path)
    db.add(blog)
    db.commit()
    db.refresh(blog)
    return blog


def get_by_slug(db: Session, slug: str, user_id: UUID) -> Blog | None:
    return db.query(Blog).filter(Blog.slug == slug, Blog.user_id == user_id).first()


def get_by_id(db: Session, blog_id: UUID) -> Blog | None:
    return db.query(Blog).filter(Blog.id == blog_id).first()


def list_by_user(db: Session, user_id: UUID) -> list[Blog]:
    return (
        db.query(Blog)
        .filter(Blog.user_id == user_id, Blog.published == True)
        .order_by(Blog.created_at.desc())
        .all()
    )


def update(db: Session, blog: Blog, title: str, updated_at: datetime) -> Blog:
    blog.title = title
    blog.updated_at = updated_at
    db.commit()
    db.refresh(blog)
    return blog
