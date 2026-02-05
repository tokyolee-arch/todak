import { create } from "zustand";
import type { Parent } from "@/types";

interface ParentsState {
  parents: Parent[];
  setParents: (parents: Parent[]) => void;
  addParent: (parent: Parent) => void;
  removeParent: (id: string) => void;
}

export const useParentsStore = create<ParentsState>((set) => ({
  parents: [],
  setParents: (parents) => set({ parents }),
  addParent: (parent) =>
    set((state) => ({ parents: [...state.parents, parent] })),
  removeParent: (id) =>
    set((state) => ({
      parents: state.parents.filter((p) => p.id !== id),
    })),
}));
