from uuid import UUID

from sqlalchemy.orm import Session

from app.models import User


def create_user(
    db: Session,
    email: str,
    username: str,
    password_hash: str | None,
    google_id: str | None = None,
) -> User:
    user = User(
        email=email,
        username=username,
        password_hash=password_hash,
        google_id=google_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_by_google_id(db: Session, google_id: str) -> User | None:
    return db.query(User).filter(User.google_id == google_id).first()


def get_by_id(db: Session, user_id: UUID) -> User | None:
    return db.query(User).filter(User.id == user_id).first()
