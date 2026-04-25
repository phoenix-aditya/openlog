"use client";

import Editor from "@/components/Editor";

export default function EditDraftPage({ params }: { params: { draftId: string } }) {
  return <Editor initialDraftId={params.draftId} />;
}
