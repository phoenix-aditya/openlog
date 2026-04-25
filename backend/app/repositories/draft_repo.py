from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Draft


def create(db: Session, user_id: UUID, md_path: str, draft_id: UUID | None = None) -> Draft:
    draft = Draft(id=draft_id, user_id=user_id, md_path=md_path)
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def get_by_id(db: Session, draft_id: UUID) -> Draft | None:
    return db.query(Draft).filter(Draft.id == draft_id).first()


def list_by_user(db: Session, user_id: UUID) -> list[Draft]:
    return (
        db.query(Draft)
        .filter(Draft.user_id == user_id)
        .order_by(Draft.updated_at.desc())
        .all()
    )


def update(db: Session, draft: Draft, title: str, updated_at: datetime) -> Draft:
    draft.title = title
    draft.updated_at = updated_at
    db.commit()
    db.refresh(draft)
    return draft


def delete(db: Session, draft: Draft) -> None:
    db.delete(draft)
    db.commit()
