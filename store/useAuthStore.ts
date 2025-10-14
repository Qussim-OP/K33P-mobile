import * as SecureStore from 'expo-secure-store';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  isAuthenticated: boolean;
  faceData: FaceData | null;
  biometricSetup: BiometricSetup;
  setFaceData: (data: FaceData) => void;
  setFingerprintComplete: () => void;
  setVoiceComplete: () => void;
  setIrisComplete: () => void;
  clearFaceData: () => void;
  setIsAuthenticated: (value: boolean) => void;
  logStoreState: () => Promise<void>;
  getCompletedBiometrics: () => string[];
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
      isAuthenticated: false,
      faceData: null,
      biometricSetup: {
        face: false,
        fingerprint: false,
        voice: false,
        iris: false
      },
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
          biometricSetup: state.biometricSetup
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
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ 
        faceData: state.faceData,
        isAuthenticated: state.isAuthenticated,
        biometricSetup: state.biometricSetup
      }),
    }
  )
);

// Helper hooks
export const useFaceData = () => useAuthStore((state) => state.faceData);
export const useSetFaceData = () => useAuthStore((state) => state.setFaceData);
export const useSetFingerprintComplete = () => useAuthStore((state) => state.setFingerprintComplete);
export const useSetVoiceComplete = () => useAuthStore((state) => state.setVoiceComplete);
export const useSetIrisComplete = () => useAuthStore((state) => state.setIrisComplete);
export const useLogAuthStore = () => useAuthStore((state) => state.logStoreState);
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