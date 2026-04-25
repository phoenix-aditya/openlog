import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.integrations import supabase_storage
from app.models import Draft
from app.repositories import draft_repo
from app.core.sanitize import sanitize_html


def create_draft(db: Session, user_id: UUID) -> Draft:
    draft_id = uuid.uuid4()
    md_path = f"drafts/{user_id}/{draft_id}.md"
    draft = draft_repo.create(db, user_id=user_id, md_path=md_path, draft_id=draft_id)
    supabase_storage.upload(md_path, "")
    return draft


def autosave(
    db: Session,
    draft_id: UUID,
    user_id: UUID,
    title: str,
    content: str,
) -> Draft:
    draft = draft_repo.get_by_id(db, draft_id)
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    if draft.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    supabase_storage.upload(draft.md_path, sanitize_html(content))
    # Re-fetch to avoid StaleDataError after out-of-band I/O
    db.expire(draft)
    draft = draft_repo.get_by_id(db, draft_id)
    return draft_repo.update(db, draft, title=title, updated_at=datetime.now(timezone.utc))


def get_draft(db: Session, draft_id: UUID, user_id: UUID) -> tuple[Draft, str]:
    draft = draft_repo.get_by_id(db, draft_id)
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    if draft.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    content = supabase_storage.download(draft.md_path)
    return draft, content


def list_drafts(db: Session, user_id: UUID) -> list[Draft]:
    return draft_repo.list_by_user(db, user_id)


def delete_draft(db: Session, draft_id: UUID, user_id: UUID) -> None:
    draft = draft_repo.get_by_id(db, draft_id)
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    if draft.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    # Best-effort storage delete; ignore errors if file doesn't exist
    try:
        supabase_storage._get_client().delete_object(
            Bucket=supabase_storage.BUCKET, Key=draft.md_path
        )
    except Exception:
        pass
    draft_repo.delete(db, draft)
