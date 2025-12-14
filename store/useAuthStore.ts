import * as SecureStore from 'expo-secure-store';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Add these new interfaces
interface AuthMethod {
  type: string;
  data?: string;
  createdAt: string;
  lastUsed?: string;
}

interface UserData {
  userId: string;
  phoneNumber?: string;
  walletAddress?: string;
  verificationMethod: string;
  zkCommitment?: string;
  authMethods: AuthMethod[];
  registeredAuthMethods: string[];
  requiresDeposit: boolean;
  isVerified: boolean;
  message: string;
}

interface FaceData {
  token: string;
  analysis: {
    age: { value: number };
    beauty: { female_score: number; male_score: number };
    emotion: {
      anger: number;
      disgust: number;
      fear: number;
      happiness: number;
      neutral: number;
      sadness: number;
      surprise: number;
    };
    eyegaze: {
      left_eye_gaze: {
        position_x_coordinate: number;
        position_y_coordinate: number;
        vector_x_component: number;
        vector_y_component: number;
        vector_z_component: number;
      };
      right_eye_gaze: {
        position_x_coordinate: number;
        position_y_coordinate: number;
        vector_x_component: number;
        vector_y_component: number;
        vector_z_component: number;
      };
    };
    gender: { value: string };
    mouthstatus: {
      close: number;
      open: number;
      other_occlusion: number;
      surgical_mask_or_respirator: number;
    };
    skinstatus: {
      acne: number;
      dark_circle: number;
      health: number;
      stain: number;
    };
  };
}

interface BiometricSetup {
  face: boolean;
  fingerprint: boolean;
  voice: boolean;
  iris: boolean;
}

interface AuthState {
  // Existing state
  isAuthenticated: boolean;
  faceData: FaceData | null;
  biometricSetup: BiometricSetup;
  
  // NEW: User data and auth methods
  userData: UserData | null;
  authMethods: AuthMethod[];
  authToken: string | null;
  
  // Existing actions
  setFaceData: (data: FaceData) => void;
  setFingerprintComplete: () => void;
  setVoiceComplete: () => void;
  setIrisComplete: () => void;
  clearFaceData: () => void;
  setIsAuthenticated: (value: boolean) => void;
  logStoreState: () => Promise<void>;
  getCompletedBiometrics: () => string[];
  
  // NEW: User data actions
  setUserData: (userData: UserData) => void;
  setAuthMethods: (authMethods: AuthMethod[]) => void;
  setAuthToken: (token: string) => void;
  clearUserData: () => void;
  clearAuth: () => void;
  
  // NEW: Helper methods
  hasAuthMethod: (methodType: string) => boolean;
  getAuthMethod: (methodType: string) => AuthMethod | undefined;
}

const secureStorage = {
  getItem: async (name: string) => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Existing state
      isAuthenticated: false,
      faceData: null,
      biometricSetup: {
        face: false,
        fingerprint: false,
        voice: false,
        iris: false
      },
      
      // NEW state
      userData: null,
      authMethods: [],
      authToken: null,

      // Existing actions
      setFaceData: (data) => {
        console.log('Setting face data in store:', data);
        set({ 
          faceData: data,
          biometricSetup: { ...get().biometricSetup, face: true }
        });
      },
      setFingerprintComplete: () => {
        set({ 
          biometricSetup: { ...get().biometricSetup, fingerprint: true }
        });
      },
      setVoiceComplete: () => {
        set({ 
          biometricSetup: { ...get().biometricSetup, voice: true }
        });
      },
      setIrisComplete: () => {
        set({ 
          biometricSetup: { ...get().biometricSetup, iris: true }
        });
      },
      clearFaceData: () => {
        console.log('Clearing face data from store');
        set({ 
          faceData: null,
          biometricSetup: { ...get().biometricSetup, face: false }
        });
      },
      setIsAuthenticated: (value) => set({ isAuthenticated: value }),
      logStoreState: async () => {
        const state = get();
        console.log('Current auth store state:', {
          isAuthenticated: state.isAuthenticated,
          faceData: state.faceData,
          biometricSetup: state.biometricSetup,
          userData: state.userData,
          authMethods: state.authMethods,
          authToken: state.authToken ? '***' : null
        });
        
        try {
          const token = await SecureStore.getItemAsync('user_face_token');
          const analysis = await SecureStore.getItemAsync('user_face_analysis');
          console.log('SecureStore contents:', {
            user_face_token: token,
            user_face_analysis: analysis ? JSON.parse(analysis) : null
          });
        } catch (error) {
          console.error('Error reading SecureStore:', error);
        }
      },
      getCompletedBiometrics: () => {
        const { biometricSetup } = get();
        const completed: string[] = [];
        if (biometricSetup.face) completed.push('Face I.D');
        if (biometricSetup.fingerprint) completed.push('Fingerprint');
        if (biometricSetup.voice) completed.push('Voice ID');
        if (biometricSetup.iris) completed.push('Iris Scan');
        return completed;
      },

      // NEW: User data actions
      setUserData: (userData) => {
        console.log('Setting user data in store:', {
          userId: userData.userId,
          authMethodsCount: userData.authMethods.length,
          verificationMethod: userData.verificationMethod
        });
        set({ userData });
      },
      setAuthMethods: (authMethods) => {
        console.log('Setting auth methods in store:', authMethods.map(m => m.type));
        set({ authMethods });
      },
      setAuthToken: (token) => {
        console.log('Setting auth token in store');
        set({ authToken: token });
      },
      clearUserData: () => {
        console.log('Clearing user data from store');
        set({ 
          userData: null, 
          authMethods: [], 
          authToken: null 
        });
      },
      clearAuth: () => {
        console.log('Clearing all auth data from store');
        set({ 
          isAuthenticated: false,
          userData: null,
          authMethods: [],
          authToken: null,
          faceData: null,
          biometricSetup: {
            face: false,
            fingerprint: false,
            voice: false,
            iris: false
          }
        });
      },

      // NEW: Helper methods
      hasAuthMethod: (methodType: string) => {
        const { authMethods } = get();
        return authMethods.some(method => method.type === methodType);
      },
      getAuthMethod: (methodType: string) => {
        const { authMethods } = get();
        return authMethods.find(method => method.type === methodType);
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ 
        faceData: state.faceData,
        isAuthenticated: state.isAuthenticated,
        biometricSetup: state.biometricSetup,
        userData: state.userData,
        authMethods: state.authMethods,
        authToken: state.authToken
      }),
    }
  )
);

// Existing helper hooks
export const useFaceData = () => useAuthStore((state) => state.faceData);
export const useSetFaceData = () => useAuthStore((state) => state.setFaceData);
export const useSetFingerprintComplete = () => useAuthStore((state) => state.setFingerprintComplete);
export const useSetVoiceComplete = () => useAuthStore((state) => state.setVoiceComplete);
export const useSetIrisComplete = () => useAuthStore((state) => state.setIrisComplete);
export const useLogAuthStore = () => useAuthStore((state) => state.logStoreState);

// NEW helper hooks
export const useUserData = () => useAuthStore((state) => state.userData);
export const useAuthMethods = () => useAuthStore((state) => state.authMethods);
export const useAuthToken = () => useAuthStore((state) => state.authToken);
export const useSetUserData = () => useAuthStore((state) => state.setUserData);
export const useSetAuthMethods = () => useAuthStore((state) => state.setAuthMethods);
export const useSetAuthToken = () => useAuthStore((state) => state.setAuthToken);
export const useClearUserData = () => useAuthStore((state) => state.clearUserData);
export const useClearAuth = () => useAuthStore((state) => state.clearAuth);
export const useHasAuthMethod = () => useAuthStore((state) => state.hasAuthMethod);
export const useGetAuthMethod = () => useAuthStore((state) => state.getAuthMethod);

// store/useAuthStore.ts
export const useCompletedBiometrics = () => {
  // Get the raw biometric setup from store
  const biometricSetup = useAuthStore(state => state.biometricSetup);
  
  // Calculate completed biometrics based on setup
  return useMemo(() => {
    const completed: string[] = [];
    if (biometricSetup.face) completed.push('Face I.D');
    if (biometricSetup.fingerprint) completed.push('Fingerprint');
    if (biometricSetup.voice) completed.push('Voice ID');
    if (biometricSetup.iris) completed.push('Iris Scan');
    return completed;
  }, [biometricSetup]);
};

// NEW: Helper hook to check if user requires phone verification
export const useRequiresPhoneVerification = () => {
  const userData = useUserData();
  return useMemo(() => {
    return userData?.requiresDeposit || false;
  }, [userData]);
};

// NEW: Helper hook to get available auth method types
export const useAvailableAuthMethods = () => {
  const authMethods = useAuthMethods();
  return useMemo(() => {
    return authMethods.map(method => method.type);
  }, [authMethods]);
};