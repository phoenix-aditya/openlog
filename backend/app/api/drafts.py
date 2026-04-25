from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas.drafts import DraftDetailResponse, DraftListItem, DraftResponse, DraftUpsert
from app.services import draft_service

router = APIRouter(prefix="/drafts", tags=["drafts"])


@router.post("", response_model=DraftResponse, status_code=status.HTTP_201_CREATED)
def create_draft(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    draft = draft_service.create_draft(db, user_id=current_user.id)
    return draft


@router.put("/{draft_id}", response_model=DraftResponse)
def autosave_draft(
    draft_id: UUID,
    body: DraftUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    draft = draft_service.autosave(
        db,
        draft_id=draft_id,
        user_id=current_user.id,
        title=body.title,
        content=body.content,
    )
    return draft


@router.get("", response_model=list[DraftListItem])
def list_drafts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return draft_service.list_drafts(db, user_id=current_user.id)


@router.get("/{draft_id}", response_model=DraftDetailResponse)
def get_draft(
    draft_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    draft, content = draft_service.get_draft(db, draft_id=draft_id, user_id=current_user.id)
    return DraftDetailResponse(
        id=draft.id,
        title=draft.title,
        content=content,
        updated_at=draft.updated_at,
    )


@router.delete("/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft(
    draft_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    draft_service.delete_draft(db, draft_id=draft_id, user_id=current_user.id)
