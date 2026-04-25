from dataclasses import dataclass

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@dataclass
class GoogleUserInfo:
    email: str
    google_id: str


def exchange_code(code: str) -> GoogleUserInfo:
    with httpx.Client() as client:
        token_resp = client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange Google auth code",
            )
        access_token = token_resp.json().get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token returned from Google",
            )

        userinfo_resp = client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch Google user info",
            )
        userinfo = userinfo_resp.json()

    return GoogleUserInfo(
        email=userinfo["email"],
        google_id=str(userinfo["id"]),
    )
