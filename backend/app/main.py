from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.blogs import router as blogs_router
from app.api.drafts import router as drafts_router
from app.api.users import router as users_router

app = FastAPI(title="OpenLog API", root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://openlog.in",
        "https://www.openlog.in",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(drafts_router)
app.include_router(blogs_router)
app.include_router(users_router)


@app.get("/health")
def health():
    return {"status": "ok"}
