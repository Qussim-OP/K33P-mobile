import { create } from 'zustand';

interface EmailStore {
  nokEmail: string;
  setNokEmail: (number: string) => void;
  clearEmail: () => void;
}

export const useNokEmailStore = create<EmailStore>((set) => ({
  nokEmail: '', 
  setNokEmail: (email: string) => set({ nokEmail: email }),
  clearEmail: () => set({ nokEmail: ''})
}));


