import { create } from 'zustand';

export interface PendingCredential {
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

interface PendingCredentialsState {
  credentials: PendingCredential[];
  add: (credential: PendingCredential) => void;
  clear: () => void;
}

export const usePendingCredentialsStore = create<PendingCredentialsState>(
  (set) => ({
    credentials: [],
    add: (credential) =>
      set((state) => ({
        credentials: [...state.credentials, credential],
      })),
    clear: () => set({ credentials: [] }),
  }),
);
