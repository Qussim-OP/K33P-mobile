/**
 * API utility functions for K33P mobile app
 * Updated for Midnight Passport integration
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3501';

export interface DIDCreateRequest {
  userId: string;
  phoneNumber: string;
  pin?: string;
  biometricData?: string;
}

export interface DIDCreateResponse {
  success: boolean;
  did?: string;
  message?: string;
  error?: string;
}

export interface SignupRequest {
  userId: string;
  did: string;
  phoneHash: string;
  pinHash: string;
  authMethods: any[];
  verificationMethod: string;
}

export interface SignupResponse {
  success: boolean;
  data?: {
    token?: string;
    userId?: string;
    did?: string;
    authMethods?: any[];
  };
  error?: string;
}

/**
 * Create a Midnight DID
 */
export async function createDID(request: DIDCreateRequest): Promise<DIDCreateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/did/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error creating DID:', error);
    return {
      success: false,
      error: error.message || 'Failed to create DID'
    };
  }
}

/**
 * Signup user with Midnight DID
 */
export async function signupUser(request: SignupRequest): Promise<SignupResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/complete-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error signing up user:', error);
    return {
      success: false,
      error: error.message || 'Failed to signup'
    };
  }
}

/**
 * Create authentication methods (phone, PIN, biometric)
 * This function hashes the input data for secure storage
 */
export function createAuthMethods(phoneNumber: string, pin: string, userId: string) {
  const crypto = require('crypto-js');
  
  // Hash phone number
  const phoneHash = crypto.SHA256(phoneNumber).toString();
  
  // Hash PIN
  const pinHash = crypto.SHA256(pin).toString();
  
  return [
    {
      type: 'phone',
      data: phoneHash,
      createdAt: new Date()
    },
    {
      type: 'pin',
      data: pinHash,
      createdAt: new Date()
    },
    {
      type: 'fingerprint',
      createdAt: new Date()
    }
  ];
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${random}`;
}
