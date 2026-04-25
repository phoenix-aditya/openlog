"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";

type Draft = { id: string; title: string; updated_at: string };

function formatDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    api.listDrafts()
      .then(setDrafts)
      .catch((err) => {
        if ((err as { status?: number }).status === 401) {
          window.location.href = "/login";
        } else {
          setError("Failed to load drafts.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function requestDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmId(id);
  }

  async function confirmDelete() {
    if (!confirmId) return;
    const id = confirmId;
    setConfirmId(null);
    setDeleting(id);
    try {
      await api.deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("Failed to delete draft.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      {confirmId && (
        <ConfirmDialog
          title="Delete draft?"
          message="This draft will be permanently deleted and cannot be recovered."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Drafts</h1>
        <Link
          href="/editor"
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
        >
          + New draft
        </Link>
      </div>

      {error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No drafts yet</p>
          <p className="text-sm">
            <Link href="/editor" className="text-gray-900 underline">Start writing</Link> your first post.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {drafts.map((draft) => (
            <li key={draft.id} className="flex items-center group">
              <Link
                href={`/editor/${draft.id}`}
                className="flex-1 flex items-center justify-between py-4 hover:bg-gray-50 dark:hover:bg-gray-900 -mx-3 px-3 rounded-lg transition-colors min-w-0"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {draft.title || <span className="text-gray-400 italic">Untitled</span>}
                </span>
                <span className="text-xs text-gray-400 shrink-0 ml-4">{formatDate(draft.updated_at)}</span>
              </Link>
              <button
                onClick={(e) => requestDelete(draft.id, e)}
                disabled={deleting === draft.id}
                className="ml-2 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded disabled:opacity-30"
                title="Delete draft"
              >
                {deleting === draft.id ? (
                  <span className="text-xs">…</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
