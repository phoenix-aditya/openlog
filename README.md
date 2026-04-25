# OpenLog

A markdown-based blogging platform. Writers compose posts in a TipTap editor with autosave and publish them publicly.

## Stack

- **Frontend**: Next.js 14 (App Router) — deployed on Vercel
- **Backend**: FastAPI — deployed on Railway
- **Database**: Supabase Postgres + Supabase Storage

## Getting started

### Backend

```bash
cp .env.example backend/.env
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment variables

See `.env.example` for all required variables.
