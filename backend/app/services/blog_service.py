import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.integrations import supabase_storage
from app.models import Blog
from app.repositories import blog_repo, tag_repo, user_repo
from app.services import draft_service, slug_service
from app.core.sanitize import sanitize_html


def publish(db: Session, draft_id: UUID, user_id: UUID, tags: list[str]) -> Blog:
    draft, content = draft_service.get_draft(db, draft_id=draft_id, user_id=user_id)

    if not draft.title or not draft.title.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title cannot be empty")
    # TipTap sends <p></p> for empty content — strip tags before checking
    import re
    text_content = re.sub(r"<[^>]+>", "", content).strip()
    if not text_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Content cannot be empty")

    existing_slugs = {b.slug for b in blog_repo.list_by_user(db, user_id)}
    slug = slug_service.generate_unique_slug(draft.title, existing_slugs)

    blog_id = uuid.uuid4()
    md_path = f"blogs/{user_id}/{blog_id}.md"
    supabase_storage.upload(md_path, sanitize_html(content))

    blog = blog_repo.create(db, user_id=user_id, title=draft.title, slug=slug, md_path=md_path, blog_id=blog_id)
    tag_repo.set_blog_tags(db, blog, tags)
    draft_service.delete_draft(db, draft_id=draft_id, user_id=user_id)

    db.refresh(blog)
    return blog


def get_blog(db: Session, slug: str, username: str) -> tuple[Blog, str]:
    user = user_repo.get_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    blog = blog_repo.get_by_slug(db, slug=slug, user_id=user.id)
    if blog is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    content = supabase_storage.download(blog.md_path)
    return blog, content


def list_blogs_by_user(db: Session, username: str) -> list[Blog]:
    user = user_repo.get_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return blog_repo.list_by_user(db, user.id)


def get_blog_for_edit(db: Session, blog_id: UUID, user_id: UUID) -> Blog:
    blog = blog_repo.get_by_id(db, blog_id)
    if blog is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    if blog.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return blog


def get_blog_content(db: Session, blog: Blog) -> str:
    return supabase_storage.download(blog.md_path)


def update_blog(
    db: Session,
    blog_id: UUID,
    user_id: UUID,
    title: str,
    content: str,
    tags: list[str],
) -> Blog:
    blog = blog_repo.get_by_id(db, blog_id)
    if blog is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    if blog.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    supabase_storage.upload(blog.md_path, sanitize_html(content))
    blog = blog_repo.update(db, blog, title=title, updated_at=datetime.now(timezone.utc))
    tag_repo.set_blog_tags(db, blog, tags)

    db.refresh(blog)
    return blog
