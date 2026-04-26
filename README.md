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

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` | Postgres username |
| `POSTGRES_PASSWORD` | Postgres password (use a strong value) |
| `POSTGRES_DB` | Postgres database name |
| `JWT_SECRET` | Secret key for signing JWTs — use a long random string (32+ chars) |
| `STORAGE_ACCESS_KEY` | MinIO root user (also used as S3 access key) |
| `STORAGE_SECRET_KEY` | MinIO root password (also used as S3 secret key) |
| `DOCKER_USERNAME` | Your Docker Hub username (used to pull images) |

### GitHub Actions secrets (for CI/CD)

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `NEXT_PUBLIC_API_URL` | Public URL of the backend e.g. `https://api.openlog.in` |
| `DROPLET_HOST` | Server IP address |
| `DROPLET_SSH_KEY` | Private SSH key for the server |

### Deploy

1. Push to GitHub
2. Go to Actions → "Release Docker Images" → Run workflow
3. Images are built and pushed to Docker Hub
4. Server pulls new images and restarts containers automatically

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
