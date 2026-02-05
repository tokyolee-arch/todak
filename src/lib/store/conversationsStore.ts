import { create } from "zustand";
import type { Conversation } from "@/types";

interface ConversationsState {
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
}));
