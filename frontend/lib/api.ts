// Typed API client — attaches JWT from localStorage
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(error.detail ?? "Request failed"), { status: res.status });
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// Auth
export const register = (email: string, username: string, password: string) =>
  request<{ access_token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });

export const login = (email: string, password: string) =>
  request<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const getMe = () => request<{ id: string; username: string; email: string }>("/users/me");

// Drafts
export const createDraft = () => request<{ id: string }>("/drafts", { method: "POST" });

export const saveDraft = (id: string, title: string, content: string) =>
  request<void>(`/drafts/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, content }),
  });

export const getDraft = (id: string) =>
  request<{ id: string; title: string; content: string; updated_at: string }>(`/drafts/${id}`);

export const listDrafts = () =>
  request<Array<{ id: string; title: string; updated_at: string }>>("/drafts");

export const deleteDraft = (id: string) =>
  request<void>(`/drafts/${id}`, { method: "DELETE" });

// Blogs
export const publishDraft = (draftId: string, tags: string[] = []) =>
  request<{ id: string; slug: string; author_username: string }>("/blogs", {
    method: "POST",
    body: JSON.stringify({ draft_id: draftId, tags }),
  });

export const getBlog = (username: string, slug: string) =>
  request<{
    id: string; title: string; slug: string; author_username: string;
    content: string; tags: Array<{ id: string; name: string }>; created_at: string;
  }>(`/blogs/${slug}?username=${username}`);

export const getBlogForEdit = (id: string) =>
  request<{
    id: string; title: string; slug: string; author_username: string;
    content: string; tags: Array<{ id: string; name: string }>; created_at: string;
  }>(`/blogs/id/${id}`);

export const updateBlog = (id: string, title: string, content: string, tags: string[]) =>
  request<void>(`/blogs/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, content, tags }),
  });

export const getUserBlogs = (username: string) =>
  request<Array<{ id: string; title: string; slug: string; created_at: string; tags: Array<{ name: string }> }>>(
    `/users/${username}/blogs`
  );
