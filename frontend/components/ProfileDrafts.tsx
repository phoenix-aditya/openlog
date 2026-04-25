"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as api from "@/lib/api";

type Draft = { id: string; title: string; updated_at: string };

function formatDate(iso: string) {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ProfileDrafts({ username }: { username: string }) {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // Only show drafts if this is the logged-in user's own profile
    api.getMe()
      .then((me) => {
        if (me.username !== username) return;
        return api.listDrafts().then(setDrafts);
      })
      .catch(() => {});
  }, [username]);

  if (!drafts || drafts.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Drafts</h2>
      <ul className="divide-y divide-gray-100">
        {drafts.map((draft) => (
          <li key={draft.id}>
            <Link
              href={`/editor/${draft.id}`}
              className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-3 px-3 rounded-lg transition-colors group"
            >
              <span className="font-medium text-gray-700 group-hover:text-gray-900">
                {draft.title || <span className="text-gray-400 italic">Untitled</span>}
              </span>
              <span className="text-xs text-gray-400 shrink-0 ml-4">{formatDate(draft.updated_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
