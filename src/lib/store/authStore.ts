import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  providerToken: string | null;
  setUser: (user: User | null) => void;
  setProviderToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  providerToken: null,
  setUser: (user) => set({ user }),
  setProviderToken: (token) => set({ providerToken: token }),
  logout: () => set({ user: null, providerToken: null }),
}));
