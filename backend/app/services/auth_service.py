from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.integrations import oauth_google
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


def google_oauth(db: Session, code: str) -> str:
    info = oauth_google.exchange_code(code)
    user = user_repo.get_by_google_id(db, info.google_id)
    if user is None:
        # Check if an account with this email already exists; link it
        user = user_repo.get_by_email(db, info.email)
        if user is None:
            # Derive a unique username from the email local part
            base = info.email.split("@")[0]
            username = base
            counter = 1
            while user_repo.get_by_username(db, username):
                username = f"{base}{counter}"
                counter += 1
            user = user_repo.create_user(
                db,
                email=info.email,
                username=username,
                password_hash=None,
                google_id=info.google_id,
            )
        else:
            # Link google_id to existing account
            user.google_id = info.google_id
            db.commit()
            db.refresh(user)
    return create_access_token(user.id)
