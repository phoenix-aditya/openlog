from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    token = auth_service.register(db, email=body.email, username=body.username, password=body.password)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    token = auth_service.login(db, email=body.email, password=body.password)
    return TokenResponse(access_token=token)


@router.get("/google/callback", response_model=TokenResponse)
def google_callback(code: str, db: Session = Depends(get_db)):
    token = auth_service.google_oauth(db, code=code)
    return TokenResponse(access_token=token)
