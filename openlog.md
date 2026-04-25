# OpenLog MD

## 🎯 Scope (v1 Features)

1. User Login (Google OAuth ready)
2. User Registration (username + basic setup)
3. User Profile (list of published blogs), user profiles will be available at openlog.in/username
4. Blog Page (markdown content + author + tag breadcrumbs)
5. Blog Editor (write, save drafts, publish)

---

# 🧱 Architecture

```text
Next.js (Frontend + SSR)
        ↓
FastAPI (Backend API)
        ↓
Supabase (Postgres + Storage)
        ↓
Cloudflare (CDN)
```

---

# 📁 Monorepo Structure

```bash
repo/
├── backend/
├── frontend/
└── README.md
```

---

# ⚙️ Backend (FastAPI)

## 📂 Structure

```bash
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── blogs.py
│   │   └── drafts.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   │
│   ├── db/
│   │   ├── session.py
│   │   └── models/
│   │       ├── user.py
│   │       ├── blog.py
│   │       ├── draft.py
│   │       ├── tag.py
│   │       └── blog_tag.py
│   │
│   ├── schemas/
│   ├── repositories/
│   ├── services/
│   ├── integrations/
│   │   ├── supabase_storage.py
│   │   └── oauth_google.py
│   │
│   └── utils/
│       ├── markdown.py
│       └── slug.py
│
├── requirements.txt
├── Dockerfile
└── .env
```

---

## 🧠 Backend Layers

* **api/** → routes (thin)
* **services/** → business logic
* **repositories/** → DB access
* **integrations/** → external services

---

## 🗄️ Core Data Models

### User

```text
id, email, username
```

### Blog

```text
id
user_id
title
slug
md_path
published
created_at
```

### Draft

```text
id
user_id
title
md_path
updated_at
```

### Tag (hierarchical)

```text
id
name
parent_id
```

### BlogTag

```text
blog_id
tag_id
```

---

## 🔌 API Endpoints

### Auth

```text
POST /auth/login
POST /auth/register
```

### User

```text
GET /users/me
GET /users/{id}/blogs
```

### Blogs

```text
POST /blogs
GET /blogs/{slug}
GET /blogs
```

### Drafts

```text
POST /drafts
PUT /drafts/{id}
GET /drafts
```

---

# 🌐 Frontend (Next.js)

## 📂 Structure

```bash
frontend/
├── app/
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── profile/page.tsx
│   ├── blog/[slug]/page.tsx
│   ├── editor/page.tsx
│   └── drafts/page.tsx
│
├── components/
│   ├── editor/
│   ├── blog/
│   ├── auth/
│   └── common/
│
├── lib/
│   ├── api.ts
│   └── markdown.ts
│
├── hooks/
├── store/        # Zustand
├── types/
└── public/
```

---

## 🧠 Key Concepts

### Server Components

* Blog pages (SEO + fast load)

### Client Components

* Editor
* Forms (login/register)

---

# ✍️ Editor

* Use TipTap
* Features:

  * Markdown-like writing
  * Autosave drafts
  * Publish flow

---

# 📄 Content Handling

* Markdown stored in Supabase Storage
* Metadata in Postgres
* (Optional) pre-render HTML for performance

---

# 🏷️ Tags (Breadcrumbs)

Example:

```text
Tech > ML > Transformers
```

* Stored as hierarchical tags
* Enables future **knowledge graph**

---

# 🔄 Core Flows

## ✍️ Write Flow

```text
Editor → API → Storage (.md)
               → DB (metadata)
               → Tags
```

## 📖 Read Flow

```text
User → Next.js SSR → FastAPI → DB + Storage → HTML
```

---

# ⚡ Performance

* Use Cloudflare CDN
* Cache blog pages
* Pre-render markdown → HTML (optional)

---

# 💸 Cost (Cheapest Setup)

| Component         | Cost                |
| ----------------- | ------------------- |
| Vercel (frontend) | ₹0                  |
| FastAPI (Railway) | ₹300–₹500           |
| Supabase          | ₹0                  |
| Storage           | ₹0–₹100             |
| Cloudflare        | ₹0                  |
| **Total**         | **₹300–₹600/month** |

---

# ⚠️ Key Decisions

* Keep drafts separate from blogs ✅
* Use hierarchical tags (future graph) ✅
* Keep backend layered (no logic in routes) ✅
* Markdown as source of truth ✅

---

# 🚀 Future Extensions

* Knowledge graph (nodes + edges)
* Search (ElasticSearch)
* Versioning for blogs
* Comments / social features

---

# ✅ Summary

This setup gives you:

* Fast development
* Low cost (~₹500/month)
* SEO-ready blog pages
* Clean architecture for scaling

👉 You can build v1 without needing to rethink architecture later.
