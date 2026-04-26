from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories import user_repo


def register(db: Session, email: str, username: str, password: str) -> str:
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )
    if user_repo.get_by_email(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    if user_repo.get_by_username(db, username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    password_hash = hash_password(password)
    user = user_repo.create_user(db, email=email, username=username, password_hash=password_hash)
    return create_access_token(user.id)


def login(db: Session, email: str, password: str) -> str:
    _invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
    )
    user = user_repo.get_by_email(db, email)
    if user is None or user.password_hash is None:
        raise _invalid
    if not verify_password(password, user.password_hash):
        raise _invalid
    return create_access_token(user.id)
