import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AuthMethod {
  type: string;
  data: string;
  createdAt: string;
  lastUsed?: string;
}

interface AuthState {
  userId: string | null;
  walletAddress: string | null;
  userAuthMethods: AuthMethod[] | null;
  username: string | null;
  token: string | null;
  
  setUserId: (userId: string) => void;
  setWalletAddress: (address: string) => void;
  setUserAuthMethods: (methods: AuthMethod[]) => void;
  setUsername: (username: string) => void;
  setToken: (token: string) => void;
  clearAuthData: () => void;
  clearAllData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      walletAddress: null,
      userAuthMethods: null,
      username: null,
      token: null,
      
      setUserId: (userId: string) => set({ userId }),
      
      setWalletAddress: (walletAddress: string) => set({ walletAddress }),
      
      setUserAuthMethods: (userAuthMethods: AuthMethod[]) => set({ userAuthMethods }),
      
      setUsername: (username: string) => set({ username }),
      
      setToken: (token: string) => set({ token }),
      
      clearAuthData: () => set({ 
        userId: null, 
        walletAddress: null, 
        userAuthMethods: null,
        username: null,
        token: null
      }),
      
      clearAllData: async () => {
        try {
          // Clear all AsyncStorage data
          await AsyncStorage.clear();
          console.log('All app data cleared successfully');
          
          set({ 
            userId: null, 
            walletAddress: null, 
            userAuthMethods: null,
            username: null,
            token: null
          });
          
        } catch (error) {
          console.error('Error clearing all data:', error);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);