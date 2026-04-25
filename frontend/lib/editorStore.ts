import { create } from "zustand";

interface EditorState {
  draftId: string | null;
  title: string;
  content: string;
  isDirty: boolean;
  lastSaved: Date | null;
  saveStatus: "idle" | "saving" | "error";
}

interface EditorActions {
  setDraftId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  markSaved: () => void;
  markError: () => void;
  setSaving: () => void;
  reset: () => void;
}

const initialState: EditorState = {
  draftId: null,
  title: "",
  content: "",
  isDirty: false,
  lastSaved: null,
  saveStatus: "idle",
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  ...initialState,
  setDraftId: (id) => set({ draftId: id }),
  setTitle: (title) => set({ title, isDirty: true }),
  setContent: (content) => set({ content, isDirty: true }),
  markSaved: () => set({ isDirty: false, lastSaved: new Date(), saveStatus: "idle" }),
  markError: () => set({ saveStatus: "error" }),
  setSaving: () => set({ saveStatus: "saving" }),
  reset: () => set({ ...initialState }),
}));
