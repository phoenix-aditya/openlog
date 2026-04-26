# OpenLog

A markdown-based blogging platform. Writers register, compose posts in a rich text editor with autosave, and publish them publicly. Readers browse author profiles and read posts without logging in.

**Stack:** Next.js (App Router) · FastAPI · PostgreSQL · MinIO (S3-compatible storage)

---

## Local development

```bash
cp .env.example .env
# Edit .env and set JWT_SECRET

docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MinIO console: http://localhost:9001 (user: minioadmin / minioadmin)

---

## Production deployment

### Required environment variables (`.env.prod` on the server)

The app reads from the shared platform env file (`/opt/shared/.env.platform`) plus two app-specific secrets injected at deploy time:

**From shared platform env (`/opt/shared/.env.platform`):**

| Variable | Description |
|----------|-------------|
| `POSTGRES_HOST` | Postgres hostname (e.g. `postgres`) |
| `POSTGRES_PORT` | Postgres port (e.g. `5432`) |
| `POSTGRES_DB` | Postgres database name |
| `POSTGRES_USER` | Postgres username |
| `POSTGRES_PASSWORD` | Postgres password |
| `MINIO_ENDPOINT` | MinIO S3 endpoint (e.g. `http://minio:9000`) |
| `MINIO_ROOT_USER` | MinIO access key |
| `MINIO_ROOT_PASSWORD` | MinIO secret key |

**App-specific (GitHub/GitLab secrets):**

| Secret | Description |
|--------|-------------|
| `OPENLOG_SECRET_KEY` | JWT signing secret — long random string |
| `OPENLOG_NEXT_PUBLIC_API_URL` | Public backend URL e.g. `https://api.openlog.in` (baked into frontend image at build time) |

### GitHub Actions secrets (for image builds)

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `OPENLOG_NEXT_PUBLIC_API_URL` | Public backend URL e.g. `https://api.openlog.in` (baked into frontend image) |

### Release

Go to Actions → "Release Docker Images" → Run workflow. Pick version, which image to build, and write a changelog. Images are pushed to Docker Hub and a GitHub release is created. Deployment is handled by a separate repo.

### First-time server setup

```bash
mkdir -p /opt/openlog
cd /opt/openlog
# Copy docker-compose.prod.yml and create .env.prod from .env.prod.example
cp .env.prod.example .env.prod
nano .env.prod   # fill in all values

docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

## Project structure

```
backend/    FastAPI app (api, services, repositories, integrations, core)
frontend/   Next.js app (app router, components, lib)
```
