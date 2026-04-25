# Implementation Plan: OpenLog Platform

## Overview

Incremental build of the OpenLog platform: FastAPI backend (auth, drafts, blogs, slug generation) + Next.js frontend (editor, profile pages, blog reading). Each task wires into the previous one, ending with a fully integrated system.

## Tasks

- [x] 1. Project scaffolding and core configuration
  - Create FastAPI project structure: `app/api/`, `app/services/`, `app/repositories/`, `app/integrations/`, `app/core/`
  - Create Next.js App Router project with `app/`, `components/`, `lib/` directories
  - Implement `app/core/config.py` with Pydantic settings (DATABASE_URL, SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET)
  - Set up SQLAlchemy engine and session factory
  - Create Alembic migration for all tables: `users`, `blogs`, `drafts`, `tags`, `blog_tags`
  - _Requirements: 1.1, 2.1, 5.3_

- [x] 2. Security and authentication core
  - [x] 2.1 Implement `app/core/security.py`
    - `hash_password(plain: str) -> str` using bcrypt
    - `verify_password(plain: str, hashed: str) -> bool`
    - `create_access_token(user_id: UUID) -> str` — 7-day expiry JWT
    - `decode_access_token(token: str) -> UUID` — raises on invalid/expired
    - FastAPI dependency `get_current_user` that extracts and validates JWT from `Authorization: Bearer` header
    - _Requirements: 1.6, 2.1, 2.2_

  - [ ]* 2.2 Write unit tests for security module
    - Test password hash/verify round-trip
    - Test JWT encode/decode round-trip
    - Test expired token raises error
    - _Requirements: 1.6, 2.1_

- [x] 3. User repository and auth service
  - [x] 3.1 Implement `app/repositories/user_repo.py`
    - `create_user`, `get_by_email`, `get_by_username`, `get_by_google_id`, `get_by_id`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.2 Implement `app/services/auth_service.py`
    - `register(email, username, password)` — hashes password, checks uniqueness, returns token; raises 409 on duplicate email/username, 400 on short password
    - `login(email, password)` — verifies credentials, returns token; raises generic 401 on any failure (no hint about which field failed)
    - `google_oauth(code)` — exchanges code via `oauth_google.py`, creates or retrieves user, returns token
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.3 Implement `app/integrations/oauth_google.py`
    - `exchange_code(code: str) -> GoogleUserInfo` — calls Google token endpoint, returns email + google_id
    - _Requirements: 1.2, 2.2_

  - [x] 3.4 Implement `app/api/auth.py`
    - `POST /auth/register` → `RegisterRequest` → `auth_service.register`
    - `POST /auth/login` → `LoginRequest` → `auth_service.login`
    - `GET /auth/google/callback` → `auth_service.google_oauth`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.5 Write unit tests for auth service
    - Test register success, duplicate email 409, duplicate username 409, short password 400
    - Test login success, unknown email 401, wrong password 401 (same message for both)
    - _Requirements: 1.3, 1.4, 1.5, 2.3, 2.4, 2.5_

- [x] 4. Slug service and property tests
  - [x] 4.1 Implement `app/services/slug_service.py`
    - `generate_base_slug(title: str) -> str` — lowercase, replace spaces with hyphens, strip non-alphanumeric (except hyphens), collapse consecutive hyphens, strip leading/trailing hyphens
    - `generate_unique_slug(title: str, existing_slugs: set[str]) -> str` — appends `-2`, `-3`, … until unique
    - _Requirements: 6.2, 6.3, 9.1, 9.2, 9.3_

  - [ ]* 4.2 Write property test: Slug character invariant (Property 1)
    - **Property 1: Slug character invariant**
    - **Validates: Requirements 9.1**
    - Use Hypothesis to generate arbitrary unicode title strings; assert `re.fullmatch(r'[a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9]', slug)` (or empty string handled gracefully)
    - Tag: `# Feature: openlog-platform, Property 1: Slug character invariant`

  - [ ]* 4.3 Write property test: Slug uniqueness per author (Property 2)
    - **Property 2: Slug uniqueness per author**
    - **Validates: Requirements 6.3, 9.2, 9.3**
    - Use Hypothesis to generate lists of distinct titles; assert all produced slugs are distinct
    - Tag: `# Feature: openlog-platform, Property 2: Slug uniqueness per author`

  - [ ]* 4.4 Write property test: Slug determinism (Property 3)
    - **Property 3: Slug determinism**
    - **Validates: Requirements 9.3**
    - Use Hypothesis to generate arbitrary titles with empty existing-slug namespace; assert two calls return the same base slug
    - Tag: `# Feature: openlog-platform, Property 3: Slug determinism`

  - [ ]* 4.5 Write unit tests for slug edge cases
    - Empty string, all special characters, very long titles, unicode-only titles
    - _Requirements: 9.1_

- [x] 5. Draft repository, service, and API
  - [x] 5.1 Implement `app/integrations/supabase_storage.py`
    - `upload(path: str, content: str)` — creates or overwrites a file in Supabase Storage
    - `download(path: str) -> str` — fetches file content
    - _Requirements: 5.3, 6.1, 7.2_

  - [x] 5.2 Implement `app/repositories/draft_repo.py`
    - `create`, `get_by_id`, `list_by_user`, `update`, `delete`
    - _Requirements: 5.2, 5.3, 5.6, 8.1, 8.2_

  - [x] 5.3 Implement `app/services/draft_service.py`
    - `create_draft(user_id)` — creates DB record + empty Storage file at `drafts/{user_id}/{draft_id}.md`
    - `autosave(draft_id, user_id, title, content)` — ownership check (403 if not owner), overwrites Storage file, updates Postgres metadata
    - `get_draft(draft_id, user_id)` — ownership check, fetches metadata + content from Storage
    - `list_drafts(user_id)` — returns all drafts for user sorted by `updated_at` desc
    - `delete_draft(draft_id, user_id)` — ownership check, deletes Storage file + DB record
    - _Requirements: 5.2, 5.3, 5.5, 5.6, 8.1, 8.2_

  - [x] 5.4 Implement `app/api/drafts.py`
    - `POST /drafts`, `PUT /drafts/{id}`, `GET /drafts`, `GET /drafts/{id}`, `DELETE /drafts/{id}`
    - All routes require `get_current_user` dependency
    - _Requirements: 5.2, 5.3, 5.5, 5.6, 8.1, 8.2_

  - [ ]* 5.5 Write property test: Autosave content round-trip (Property 5)
    - **Property 5: Autosave content round-trip**
    - **Validates: Requirements 5.2, 5.3, 5.5**
    - Use Hypothesis to generate arbitrary markdown strings; mock Supabase Storage; assert `get_draft` returns same content after `autosave`
    - Tag: `# Feature: openlog-platform, Property 5: Autosave content round-trip`

  - [ ]* 5.6 Write property test: Draft ownership isolation (Property 4)
    - **Property 4: Draft ownership isolation**
    - **Validates: Requirements 5.6, 8.2**
    - Integration test: create draft as user A, attempt list/fetch as user B; assert draft not returned
    - Tag: `# Feature: openlog-platform, Property 4: Draft ownership isolation`

- [x] 6. Checkpoint — auth, drafts, and slug tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Blog repository, service, and API
  - [x] 7.1 Implement `app/repositories/blog_repo.py` and `app/repositories/tag_repo.py`
    - `blog_repo`: `create`, `get_by_slug`, `get_by_id`, `list_by_user`, `update`
    - `tag_repo`: `get_or_create_tag`, `set_blog_tags`
    - _Requirements: 3.1, 4.1, 6.1, 6.6, 7.2_

  - [x] 7.2 Implement `app/services/blog_service.py`
    - `publish(draft_id, user_id, tags)` — validates non-empty title/content (400 if empty), generates unique slug, writes Storage file at `blogs/{user_id}/{blog_id}.md`, creates Blog record, creates/links tags, deletes draft
    - `get_blog(slug, username)` — fetches blog + content from Storage; 404 if not found
    - `list_blogs_by_user(username)` — returns published blogs sorted by `created_at` desc; 404 if user not found
    - `update_blog(blog_id, user_id, title, content, tags)` — ownership check (403), overwrites Storage, updates Postgres; slug unchanged
    - _Requirements: 3.1, 3.3, 4.1, 4.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.2, 7.3, 7.4_

  - [x] 7.3 Implement `app/api/blogs.py` and `app/api/users.py`
    - `POST /blogs`, `GET /blogs/{slug}`, `GET /blogs`, `PUT /blogs/{id}`
    - `GET /users/me`, `GET /users/{username}/blogs`
    - _Requirements: 3.1, 3.3, 4.1, 4.3, 6.1, 6.5, 7.2, 7.3_

  - [ ]* 7.4 Write property test: Publish rejects empty content (Property 6)
    - **Property 6: Publish rejects empty content**
    - **Validates: Requirements 6.5**
    - Use Hypothesis to generate whitespace-only strings for title and content; assert 400 returned and no Blog record created
    - Tag: `# Feature: openlog-platform, Property 6: Publish rejects empty content`

  - [ ]* 7.5 Write property test: Blog edit ownership (Property 7)
    - **Property 7: Blog edit ownership**
    - **Validates: Requirements 7.3**
    - Use Hypothesis to generate random user IDs ≠ blog owner; assert 403 returned
    - Tag: `# Feature: openlog-platform, Property 7: Blog edit ownership`

  - [ ]* 7.6 Write property test: Slug stability on edit (Property 8)
    - **Property 8: Slug stability on edit**
    - **Validates: Requirements 7.4**
    - Use Hypothesis to generate arbitrary title updates; assert slug field unchanged after `update_blog`
    - Tag: `# Feature: openlog-platform, Property 8: Slug stability on edit`

  - [ ]* 7.7 Write integration tests for blog lifecycle
    - publish → fetch by slug → content matches
    - cross-user edit attempt → 403
    - _Requirements: 6.1, 6.4, 7.3_

- [x] 8. Checkpoint — full backend test suite passes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Next.js API client and auth UI
  - [x] 9.1 Implement `lib/api.ts`
    - Typed fetch wrapper that attaches JWT from localStorage/cookie
    - Functions: `register`, `login`, `getMe`, `createDraft`, `saveDraft`, `getDraft`, `listDrafts`, `deleteDraft`, `publishDraft`, `getBlog`, `updateBlog`, `getUserBlogs`
    - _Requirements: 1.1, 2.1, 5.2, 6.1, 7.2_

  - [x] 9.2 Implement `/login` and `/register` Client Components
    - `AuthForm` shared component with email/password fields
    - On success, store JWT and redirect to `/drafts`
    - Display field-level errors from API (409, 400, 401)
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.3, 2.4_

- [x] 10. Editor and autosave
  - [x] 10.1 Implement Zustand `editorStore`
    - State: `draftId`, `title`, `content`, `isDirty`, `lastSaved`, `saveStatus: 'idle' | 'saving' | 'error'`
    - Actions: `setTitle`, `setContent`, `markSaved`, `markError`
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 10.2 Implement `Editor` Client Component (`/editor` and `/editor/[draftId]`)
    - TipTap instance with title input and markdown content area
    - On mount: create new draft (if `/editor`) or load existing draft (if `/editor/[draftId]`)
    - Autosave timer: every 30 seconds, if `isDirty`, call `saveDraft` and update store
    - Show save status indicator (idle / saving / error)
    - Publish button: validates non-empty title + content client-side before calling `publishDraft`, then redirects to published blog URL
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 6.1, 6.5_

  - [x] 10.3 Implement `/editor/blog/[blogId]` Client Component
    - Load blog title, content, and tags on mount
    - Save button calls `updateBlog`; slug not changed
    - _Requirements: 7.1, 7.2_

  - [ ]* 10.4 Write frontend tests for autosave
    - Mock timer; verify `saveDraft` called at 30s when content changed, not called when unchanged
    - _Requirements: 5.2_

  - [ ]* 10.5 Write frontend tests for publish validation
    - Assert publish button blocked client-side when title or content is empty
    - _Requirements: 6.5_

- [x] 11. Drafts list page
  - Implement `/drafts` Client Component
  - Fetch and display drafts sorted by `updated_at` desc; each item links to `/editor/[draftId]`
  - Show empty state when no drafts exist
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 12. SSR profile and blog pages
  - [x] 12.1 Implement `/[username]` Server Component
    - Fetch `getUserBlogs(username)` during SSR; render `BlogCard` list sorted by `created_at` desc
    - Show empty state if no published blogs
    - Return 404 if username not found
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 12.2 Implement `/[username]/[slug]` Server Component
    - Fetch `getBlog(slug, username)` during SSR; render title, author, date, `TagBreadcrumb`, and `MarkdownRenderer`
    - Return 404 if slug not found
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 12.3 Implement `BlogCard`, `TagBreadcrumb`, and `MarkdownRenderer` Server Components
    - `BlogCard`: title, date, tag list
    - `TagBreadcrumb`: renders hierarchical tag path
    - `MarkdownRenderer`: converts markdown string to HTML
    - _Requirements: 3.1, 4.1, 4.4_

  - [ ]* 12.4 Write SSR page tests
    - Verify `[username]` renders correct blog list
    - Verify `[username]/[slug]` renders correct content
    - _Requirements: 3.4, 4.2_

- [x] 13. Final checkpoint — all tests pass, integration verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use Hypothesis (Python) with minimum 100 iterations; each tagged with `# Feature: openlog-platform, Property N: ...`
- Checkpoints ensure incremental validation before moving to the next layer
