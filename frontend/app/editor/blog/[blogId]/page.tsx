"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as api from "@/lib/api";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function EditBlogPage({ params }: { params: { blogId: string } }) {
  const { blogId } = params;
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loaded, setLoaded] = useState(false);
  const contentRef = useRef("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: { class: "outline-none min-h-[320px] text-base leading-relaxed" },
    },
    onUpdate({ editor }) {
      contentRef.current = editor.getText();
    },
  });

  useEffect(() => {
    if (!editor) return;
    api.getBlogForEdit(blogId).then((blog) => {
      setTitle(blog.title);
      setTagsInput(blog.tags.map((t) => t.name).join(", "));
      contentRef.current = blog.content;
      editor.commands.setContent(blog.content);
      setLoaded(true);
    }).catch(() => console.error("Failed to load blog for editing"));
  }, [blogId, editor]);

  async function handleSave() {
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    setSaveStatus("saving");
    try {
      await api.updateBlog(blogId, title, contentRef.current, tags);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  if (!loaded) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="h-8 w-64 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-3xl font-bold placeholder-gray-300 border-none outline-none mb-6 bg-transparent"
      />
      <div className="tiptap-content border border-gray-200 rounded-xl p-5 mb-4 focus-within:border-gray-400 transition-colors">
        <EditorContent editor={editor} />
      </div>
      <input
        type="text"
        placeholder="Tags (comma-separated)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && <span className="text-green-600">Saved</span>}
          {saveStatus === "error" && <span className="text-red-500">Error saving</span>}
        </span>
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
