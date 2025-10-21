// store/usePinStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PinState {
  pin: string;
  hasPin: boolean;
  setPin: (pin: string) => void;
  clearPin: () => void;
}

export const usePinStore = create<PinState>()(
  persist(
    (set) => ({
      pin: '0000', // Default PIN
      hasPin: false, // False by default since it's the default PIN
      setPin: (newPin: string) => set({ pin: newPin, hasPin: true }),
      clearPin: () => set({ pin: '0000', hasPin: false }),
    }),
    {
      name: 'pin-storage',
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: any) => {
        if (persistedState?.pin === null || persistedState?.pin === undefined) {
          return { pin: '0000', hasPin: false };
        }
        return persistedState;
      },
    }
  )
);