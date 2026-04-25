"use client";

import type { Editor } from "@tiptap/react";

interface Props {
  editor: Editor | null;
}

const btn = "px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30";
const activeCls = "bg-gray-200 dark:bg-gray-700";

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${btn} font-bold ${editor.isActive("heading", { level: 1 }) ? activeCls : ""}`}
        title="Heading 1"
      >H1</button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${btn} font-bold ${editor.isActive("heading", { level: 2 }) ? activeCls : ""}`}
        title="Heading 2"
      >H2</button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${btn} font-bold ${editor.isActive("heading", { level: 3 }) ? activeCls : ""}`}
        title="Heading 3"
      >H3</button>

      <span className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${btn} font-bold ${editor.isActive("bold") ? activeCls : ""}`}
        title="Bold"
      ><b>B</b></button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${btn} italic ${editor.isActive("italic") ? activeCls : ""}`}
        title="Italic"
      ><i>I</i></button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`${btn} line-through ${editor.isActive("strike") ? activeCls : ""}`}
        title="Strikethrough"
      >S</button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`${btn} font-mono ${editor.isActive("code") ? activeCls : ""}`}
        title="Inline code"
      >{"`"}</button>

      <span className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${btn} ${editor.isActive("bulletList") ? activeCls : ""}`}
        title="Bullet list"
      >• List</button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${btn} ${editor.isActive("orderedList") ? activeCls : ""}`}
        title="Numbered list"
      >1. List</button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${btn} ${editor.isActive("blockquote") ? activeCls : ""}`}
        title="Blockquote"
      >" Quote</button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`${btn} font-mono ${editor.isActive("codeBlock") ? activeCls : ""}`}
        title="Code block"
      >{"</>"}</button>
    </div>
  );
}
