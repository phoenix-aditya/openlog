"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEditorStore } from "@/lib/editorStore";
import * as api from "@/lib/api";
import EditorToolbar from "@/components/EditorToolbar";

interface EditorProps {
  initialDraftId?: string;
}

export default function Editor({ initialDraftId }: EditorProps) {
  const router = useRouter();
  const store = useEditorStore();

  // For new drafts: don't create until the user actually types something
  const draftCreatedRef = useRef(!!initialDraftId);
  const creatingRef = useRef(false); // prevent double-create

  // Lazily create a draft on first real input
  const ensureDraft = useCallback(async () => {
    if (draftCreatedRef.current || creatingRef.current) return;
    creatingRef.current = true;
    try {
      const draft = await api.createDraft();
      useEditorStore.setState({ draftId: draft.id });
      draftCreatedRef.current = true;
    } catch {
      console.error("Failed to create draft");
    } finally {
      creatingRef.current = false;
    }
  }, []);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: { class: "outline-none min-h-[320px] text-base leading-relaxed" },
    },
    onUpdate({ editor }) {
      store.setContent(editor.getHTML());
      ensureDraft();
    },
  });

  // Load existing draft
  useEffect(() => {
    if (!initialDraftId || !editor) return;
    api.getDraft(initialDraftId)
      .then((draft) => {
        useEditorStore.setState({ draftId: draft.id, title: draft.title, content: draft.content, isDirty: false });
        editor.commands.setContent(draft.content);
      })
      .catch(() => console.error("Failed to load draft"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraftId, editor]);

  // Reset store on unmount so stale state doesn't leak between sessions
  useEffect(() => {
    return () => { useEditorStore.getState().reset(); };
  }, []);

  // Autosave every 30 seconds — only if draft exists and is dirty
  useEffect(() => {
    const interval = setInterval(async () => {
      const { draftId, title, content, isDirty } = useEditorStore.getState();
      if (!isDirty || !draftId) return;
      useEditorStore.getState().setSaving();
      try {
        await api.saveDraft(draftId, title, content);
        useEditorStore.getState().markSaved();
      } catch {
        useEditorStore.getState().markError();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handlePublish() {
    const { title } = useEditorStore.getState();
    const content = editor?.getHTML() ?? "";
    const textContent = editor?.getText() ?? "";

    if (!title.trim() || !textContent.trim()) {
      alert("Title and content cannot be empty.");
      return;
    }

    // Ensure draft exists before publishing
    await ensureDraft();

    const { draftId } = useEditorStore.getState();
    if (!draftId) return;

    try {
      await api.saveDraft(draftId, title, content);
    } catch {
      alert("Failed to save before publishing. Please try again.");
      return;
    }

    try {
      const blog = await api.publishDraft(draftId, []);
      router.push(`/${blog.author_username}/${blog.slug}`);
    } catch {
      alert("Failed to publish. Please try again.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <input
        type="text"
        placeholder="Post title"
        value={store.title}
        onChange={(e) => {
          store.setTitle(e.target.value);
          ensureDraft();
        }}
        className="w-full text-3xl font-bold placeholder-gray-300 dark:placeholder-gray-600 border-none outline-none mb-6 bg-transparent text-gray-900 dark:text-gray-100"
      />
      <div className="tiptap-content border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-4 focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors text-gray-900 dark:text-gray-100">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {store.saveStatus === "saving" && "Saving…"}
          {store.saveStatus === "error" && <span className="text-red-500">Error saving</span>}
          {store.saveStatus === "idle" && store.lastSaved &&
            `Saved at ${store.lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        </span>
        <button
          onClick={handlePublish}
          className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
        >
          Publish
        </button>
      </div>
    </div>
  );
}
