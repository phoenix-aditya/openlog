# Requirements Document

## Introduction

OpenLog is a blogging platform where writers can register, write markdown-based blog posts, and publish them publicly. Readers can browse any author's profile and read published posts without logging in. The v1 scope covers authentication, user profiles, blog reading, and a markdown editor with draft autosave and publish flow.

## Glossary

- **System**: The OpenLog platform (frontend + backend combined)
- **Auth_Service**: The backend component handling authentication and session management
- **User**: A registered person with a username, email, and password or Google account
- **Author**: A User who creates and publishes blog posts
- **Reader**: Any person (authenticated or not) who reads published blog posts
- **Blog**: A published post with a title, markdown content, slug, tags, and author
- **Draft**: An unpublished, in-progress version of a blog post belonging to an Author
- **Editor**: The frontend markdown editor component used to write and publish content
- **Slug**: A URL-safe string derived from a blog title, used to identify a blog in URLs
- **Tag**: A free-form label attached to a Blog for categorization, stored hierarchically
- **Profile_Page**: The public page at `openlog.in/{username}` listing an Author's published blogs
- **Slug_Generator**: The backend utility that converts a blog title into a URL-safe slug

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a new visitor, I want to register with an email and password or via Google, so that I can start writing and publishing blog posts.

#### Acceptance Criteria

1. WHEN a visitor submits a registration form with a valid email, password, and unique username, THE Auth_Service SHALL create a new User account and return a session token.
2. WHEN a visitor completes Google OAuth consent, THE Auth_Service SHALL create or retrieve a User account linked to that Google identity and return a session token.
3. IF a registration request contains an email that already exists, THEN THE Auth_Service SHALL return a 409 error with a message indicating the email is already registered.
4. IF a registration request contains a username that already exists, THEN THE Auth_Service SHALL return a 409 error with a message indicating the username is taken.
5. IF a registration request contains a password shorter than 8 characters, THEN THE Auth_Service SHALL return a 400 error with a message describing the password requirement.
6. THE Auth_Service SHALL store passwords as salted hashes and SHALL NOT store plaintext passwords.

---

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my email and password or via Google, so that I can access my drafts and editor.

#### Acceptance Criteria

1. WHEN a User submits valid email and password credentials, THE Auth_Service SHALL return a session token valid for 7 days.
2. WHEN a User completes Google OAuth consent for an existing linked account, THE Auth_Service SHALL return a session token valid for 7 days.
3. IF a login request contains an email that does not match any registered User, THEN THE Auth_Service SHALL return a 401 error.
4. IF a login request contains a correct email but incorrect password, THEN THE Auth_Service SHALL return a 401 error.
5. THE Auth_Service SHALL NOT reveal whether a failed login was due to an unknown email or wrong password.

---

### Requirement 3: User Profile Page

**User Story:** As a Reader, I want to visit an author's profile page at `openlog.in/{username}`, so that I can see all their published blog posts.

#### Acceptance Criteria

1. WHEN a Reader navigates to `openlog.in/{username}`, THE System SHALL render a Profile_Page listing all published Blogs authored by that User, sorted by creation date descending.
2. WHEN a Reader navigates to `openlog.in/{username}`, THE System SHALL display the User's username on the Profile_Page.
3. IF the username in the URL does not match any registered User, THEN THE System SHALL return a 404 page.
4. THE System SHALL render the Profile_Page using server-side rendering so that the page is indexable by search engines.
5. WHILE a User has no published Blogs, THE System SHALL display an empty state message on the Profile_Page.

---

### Requirement 4: Blog Reading

**User Story:** As a Reader, I want to read a published blog post at its URL, so that I can consume the author's content.

#### Acceptance Criteria

1. WHEN a Reader navigates to `openlog.in/{username}/{slug}`, THE System SHALL render the Blog's markdown content as HTML, along with the title, author username, creation date, and tags.
2. THE System SHALL render Blog pages using server-side rendering so that the content is indexable by search engines.
3. IF the slug in the URL does not match any published Blog, THEN THE System SHALL return a 404 page.
4. WHEN a Blog has one or more Tags, THE System SHALL display the Tags as breadcrumb-style labels on the Blog page.

---

### Requirement 5: Blog Editor and Draft Autosave

**User Story:** As an Author, I want to write blog posts in a markdown editor that automatically saves my work, so that I never lose progress.

#### Acceptance Criteria

1. WHEN an authenticated Author opens the editor, THE Editor SHALL present a TipTap-based markdown writing interface with a title field and a content area.
2. WHILE an Author is writing, THE Editor SHALL automatically save the current title and content as a Draft to the backend every 30 seconds if the content has changed since the last save.
3. WHEN an autosave occurs, THE System SHALL store the Draft's markdown content in Supabase Storage and update the Draft metadata (title, updated_at) in Postgres.
4. IF an autosave request fails, THEN THE Editor SHALL display a non-blocking error indicator and retry on the next autosave interval.
5. WHEN an Author opens the editor for an existing Draft, THE Editor SHALL load the Draft's last saved title and content.
6. THE System SHALL associate each Draft with exactly one Author and SHALL NOT expose a Draft to any other User.

---

### Requirement 6: Blog Publishing

**User Story:** As an Author, I want to publish a draft as a blog post, so that Readers can access it publicly.

#### Acceptance Criteria

1. WHEN an Author clicks publish on a Draft with a non-empty title and non-empty content, THE System SHALL create a Blog record with `published = true`, store the markdown content in Supabase Storage, and record the metadata in Postgres.
2. WHEN a Blog is created, THE Slug_Generator SHALL derive the Slug from the Blog title by lowercasing, replacing spaces with hyphens, and removing non-alphanumeric characters.
3. IF the derived Slug already exists for the same Author, THEN THE Slug_Generator SHALL append a numeric suffix (e.g., `my-post-2`) to make the Slug unique.
4. WHEN an Author publishes a Draft, THE System SHALL delete the corresponding Draft record after the Blog is successfully created.
5. IF a publish request is made on a Draft with an empty title or empty content, THEN THE System SHALL return a 400 error and SHALL NOT create a Blog record.
6. WHEN an Author adds free-form tags during publish, THE System SHALL store each tag as a Tag record (creating it if it does not exist) and associate it with the Blog via a BlogTag record.

---

### Requirement 7: Blog Editing (Post-Publish)

**User Story:** As an Author, I want to edit a published blog post, so that I can correct mistakes or update content.

#### Acceptance Criteria

1. WHEN an authenticated Author opens a published Blog for editing, THE Editor SHALL load the Blog's current title, content, and tags.
2. WHEN an Author saves changes to a published Blog, THE System SHALL overwrite the markdown file in Supabase Storage and update the Blog metadata in Postgres.
3. THE System SHALL restrict editing of a Blog to the Author who owns it and SHALL return a 403 error for any other authenticated User attempting to edit it.
4. WHEN an Author updates a published Blog's title, THE Slug_Generator SHALL NOT change the existing Slug to preserve existing URLs.

---

### Requirement 8: Draft Management

**User Story:** As an Author, I want to view and manage my drafts, so that I can continue working on unfinished posts.

#### Acceptance Criteria

1. WHEN an authenticated Author requests their drafts list, THE System SHALL return all Drafts belonging to that Author, sorted by updated_at descending.
2. THE System SHALL restrict the drafts list to the authenticated Author and SHALL return a 401 error for unauthenticated requests.
3. WHEN an Author opens a Draft from the drafts list, THE Editor SHALL load that Draft's saved title and content.

---

### Requirement 9: Slug Generation (Round-Trip)

**User Story:** As a developer, I want slug generation to be deterministic and reversible, so that URLs are stable and predictable.

#### Acceptance Criteria

1. THE Slug_Generator SHALL produce a Slug containing only lowercase letters, digits, and hyphens.
2. FOR ALL blog titles, applying the Slug_Generator and then parsing the resulting Slug SHALL produce a string that uniquely identifies the original title within the same Author's namespace.
3. WHEN the Slug_Generator is given the same title twice for the same Author, THE Slug_Generator SHALL produce the same base Slug and append a suffix only on the second call.
