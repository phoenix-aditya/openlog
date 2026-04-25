# Design Document: OpenLog Platform

## Overview

OpenLog is a markdown-based blogging platform. Writers register, compose posts in a TipTap editor with autosave, and publish them publicly. Readers browse author profiles and read posts without logging in.

The stack is:
- **Frontend**: Next.js (App Router) — SSR for blog/profile pages, Client Components for editor and auth
- **Backend**: FastAPI — layered api → services → repositories → integrations
- **Storage**: Supabase Postgres (metadata) + Supabase Storage (markdown files)
- **CDN**: Cloudflare

v1 scope: auth (email/password + Google OAuth), profile pages, blog reading, draft autosave, publish, post-publish editing, draft management.

---

## Architecture

```
Browser
  │
  ├── Next.js (Vercel)
  │     ├── Server Components  →  FastAPI (SSR data fetch)
  │     └── Client Components  →  FastAPI (browser fetch)
  │
FastAPI (Railway)
  │
  ├── api/        (route handlers — thin)
  ├── services/   (business logic)
  ├── repositories/ (DB queries via SQLAlchemy)
  └── integrations/ (Supabase Storage, Google OAuth)
  │
Supabase
  ├── Postgres    (users, blogs, drafts, tags, blog_tags)
  └── Storage     (markdown files)
  │
Cloudflare CDN   (caches rendered blog/profile pages)
```

### Request flows

**Read (blog page)**
```
Browser → Next.js SSR → GET /blogs/{slug} → FastAPI → Postgres + Storage → HTML rendered by Next.js → Cloudflare cache
```

**Write (autosave)**
```
TipTap editor (30s interval) → PUT /drafts/{id} → FastAPI service → Storage (.md) + Postgres (metadata)
```

**Publish**
```
Author clicks Publish → POST /blogs → FastAPI service → slug generation → Storage (.md) + Postgres → Draft deleted
```

---

## Components and Interfaces

### Backend

#### API Layer (`app/api/`)

Thin FastAPI routers. Validate request shapes, call services, return responses.

| File | Endpoints |
|------|-----------|
| `auth.py` | `POST /auth/register`, `POST /auth/login` |
| `users.py` | `GET /users/me`, `GET /users/{username}/blogs` |
| `blogs.py` | `POST /blogs`, `GET /blogs/{slug}`, `GET /blogs`, `PUT /blogs/{id}` |
| `drafts.py` | `POST /drafts`, `PUT /drafts/{id}`, `GET /drafts`, `DELETE /drafts/{id}` |

#### Service Layer (`app/services/`)

| Service | Responsibilities |
|---------|-----------------|
| `auth_service.py` | Register, login, JWT creation, Google OAuth token exchange |
| `user_service.py` | Fetch user profile, list user's published blogs |
| `blog_service.py` | Create/update blog, fetch blog, list blogs, ownership check |
| `draft_service.py` | Create/update/list/delete drafts, ownership check |
| `slug_service.py` | Generate slug from title, handle uniqueness with numeric suffix |

#### Repository Layer (`app/repositories/`)

One repository per model. Raw SQLAlchemy queries, no business logic.

`user_repo.py`, `blog_repo.py`, `draft_repo.py`, `tag_repo.py`

#### Integrations (`app/integrations/`)

| Module | Purpose |
|--------|---------|
| `supabase_storage.py` | Upload/download/overwrite markdown files in Supabase Storage |
| `oauth_google.py` | Exchange Google auth code for user info |

#### Core (`app/core/`)

| Module | Purpose |
|--------|---------|
| `security.py` | JWT encode/decode, password hashing (bcrypt), token validation middleware |
| `config.py` | Pydantic settings from environment variables |

### Frontend

#### Pages (Next.js App Router)

| Route | Component type | Purpose |
|-------|---------------|---------|
| `/` | Server | Landing page |
| `/login` | Client | Login form |
| `/register` | Client | Registration form |
| `/[username]` | Server | Author profile page (SSR) |
| `/[username]/[slug]` | Server | Blog post page (SSR) |
| `/editor` | Client | New draft editor |
| `/editor/[draftId]` | Client | Edit existing draft |
| `/editor/blog/[blogId]` | Client | Edit published blog |
| `/drafts` | Client | Drafts list |

#### Key Components

| Component | Type | Purpose |
|-----------|------|---------|
| `Editor` | Client | TipTap instance, autosave timer, publish button |
| `AuthForm` | Client | Shared login/register form logic |
| `BlogCard` | Server | Blog preview card on profile page |
| `TagBreadcrumb` | Server | Renders hierarchical tag path |
| `MarkdownRenderer` | Server | Renders markdown HTML on blog page |

#### State Management (Zustand)

One store: `editorStore` — holds current draft id, title, content, dirty flag, last-saved timestamp, and save status (`idle | saving | error`).

#### API Client (`lib/api.ts`)

Typed fetch wrapper. Attaches JWT from cookie/localStorage. Used by Client Components.

---

## Data Models

### Postgres Schema

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  password_hash TEXT,          -- NULL for OAuth-only accounts
  google_id   TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Blogs
CREATE TABLE blogs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  md_path     TEXT NOT NULL,   -- Supabase Storage path
  published   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, slug)       -- slug unique per author
);

-- Drafts
CREATE TABLE drafts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL DEFAULT '',
  md_path     TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Tags (hierarchical)
CREATE TABLE tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  parent_id   UUID REFERENCES tags(id)
);

-- Blog ↔ Tag join
CREATE TABLE blog_tags (
  blog_id     UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags(id),
  PRIMARY KEY (blog_id, tag_id)
);
```

### Supabase Storage Layout

```
drafts/{user_id}/{draft_id}.md
blogs/{user_id}/{blog_id}.md
```

### Pydantic Schemas (FastAPI)

Key request/response shapes:

```python
# Auth
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str       # 3–30 chars, alphanumeric + underscores
    password: str       # min 8 chars

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Blog
class BlogCreate(BaseModel):
    draft_id: UUID
    tags: list[str] = []

class BlogResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    author_username: str
    content: str        # rendered markdown HTML
    tags: list[TagResponse]
    created_at: datetime

# Draft
class DraftUpsert(BaseModel):
    title: str
    content: str        # raw markdown

class DraftResponse(BaseModel):
    id: UUID
    title: str
    updated_at: datetime
```

### JWT Payload

```json
{ "sub": "<user_id>", "exp": "<now + 7 days>" }
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Slug character invariant

*For any* blog title string, the slug produced by the Slug_Generator SHALL contain only lowercase letters, digits, and hyphens.

**Validates: Requirements 9.1**

### Property 2: Slug uniqueness per author

*For any* two distinct blog titles submitted by the same author, the Slug_Generator SHALL produce two distinct slugs (using numeric suffix if needed), so that no two blogs share the same slug under the same author.

**Validates: Requirements 6.3, 9.2, 9.3**

### Property 3: Slug determinism

*For any* blog title, calling the Slug_Generator twice with the same title and no existing slugs in the author's namespace SHALL produce the same base slug both times.

**Validates: Requirements 9.3**

### Property 4: Draft ownership isolation

*For any* draft and any user who is not the draft's author, the system SHALL not return that draft in list or fetch responses for that user.

**Validates: Requirements 5.6, 8.2**

### Property 5: Autosave content round-trip

*For any* draft content string written by an author, saving it via the autosave path and then loading the draft SHALL return the same content string.

**Validates: Requirements 5.2, 5.3, 5.5**

### Property 6: Publish rejects empty content

*For any* draft where the title or content is empty (or whitespace-only), a publish request SHALL be rejected with a 400 error and no Blog record SHALL be created.

**Validates: Requirements 6.5**

### Property 7: Blog edit ownership

*For any* published blog and any authenticated user who is not the blog's author, an edit request SHALL be rejected with a 403 error.

**Validates: Requirements 7.3**

### Property 8: Slug stability on edit

*For any* published blog, updating the blog's title SHALL NOT change the blog's existing slug.

**Validates: Requirements 7.4**

---

## Error Handling

| Scenario | HTTP Status | Notes |
|----------|-------------|-------|
| Email already registered | 409 | Registration |
| Username already taken | 409 | Registration |
| Password < 8 chars | 400 | Registration |
| Invalid credentials | 401 | Login — same message for unknown email or wrong password |
| Unauthenticated request to protected route | 401 | |
| User attempts to edit another user's blog/draft | 403 | |
| Username or slug not found | 404 | Profile/blog pages |
| Publish with empty title or content | 400 | |
| Autosave failure | — | Non-blocking UI indicator; retry next interval |

**Auth errors**: Login always returns a generic 401 with no hint about whether the email exists (requirement 2.5).

**Autosave**: Failures are surfaced in the editor UI as a status indicator. The editor retries on the next 30-second tick rather than blocking the user.

**Storage errors**: If Supabase Storage upload fails during publish, the transaction is rolled back — no partial Blog record is created.

---

## Testing Strategy

### Unit Tests

Focus on pure logic with no I/O:

- `slug_service`: title → slug conversion, suffix appending, edge cases (empty string, all special chars, very long titles, unicode)
- `auth_service`: password hashing/verification, JWT encode/decode, token expiry
- `blog_service` / `draft_service`: ownership checks, validation logic

### Property-Based Tests

Use **Hypothesis** (Python) for backend properties. Minimum 100 iterations per property.

Each test is tagged with a comment referencing the design property:
```python
# Feature: openlog-platform, Property 1: Slug character invariant
```

| Property | What to generate | What to assert |
|----------|-----------------|----------------|
| P1: Slug character invariant | Arbitrary unicode strings as titles | `re.fullmatch(r'[a-z0-9-]+', slug)` |
| P2: Slug uniqueness per author | Lists of distinct titles | All generated slugs are distinct |
| P3: Slug determinism | Arbitrary title, empty namespace | Two calls return same base slug |
| P5: Autosave round-trip | Arbitrary markdown strings | `load(save(content)) == content` (mock Storage) |
| P6: Publish rejects empty | Whitespace-only strings for title/content | Returns 400, no DB record created |
| P7: Blog edit ownership | Random user IDs ≠ blog owner | Returns 403 |
| P8: Slug stability on edit | Any title update | Slug field unchanged after update |

P4 (draft isolation) is covered by integration tests — it depends on DB query behavior rather than pure logic.

### Integration Tests

- Auth flow: register → login → access protected route
- Draft lifecycle: create → autosave → load → publish → draft deleted
- Blog read: publish → fetch by slug → content matches
- Ownership enforcement: attempt cross-user draft/blog access

### Frontend Tests

- Editor autosave: mock timer, verify API called at 30s with changed content, not called when content unchanged
- Publish flow: empty title/content blocked client-side before API call
- SSR pages: verify `[username]` and `[username]/[slug]` pages render correct data (use Next.js test utilities or Playwright)
