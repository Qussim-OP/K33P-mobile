import { create } from 'zustand';

interface NokPhoneStore {
  nokPhoneNumber: string;
  nokFormattedNumber: string;
  setNokPhoneNumber: (number: string) => void;
  setNokFormattedNumber: (number: string) => void;
  clearNokNumbers: () => void;
}

export const useNokPhoneStore = create<NokPhoneStore>((set) => ({
  nokPhoneNumber: '', 
  nokFormattedNumber: '',
  setNokPhoneNumber: (number: string) => set({ nokPhoneNumber: number }),
  setNokFormattedNumber: (number: string) => set({ nokFormattedNumber: number }),
  clearNokNumbers: () => set({ nokPhoneNumber: '', nokFormattedNumber: '' })
}));