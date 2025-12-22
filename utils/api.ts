// utils/api.ts
import { useAuthStore } from '@/store/useAuthMethod';
import { encryptPhoneData } from '@/utils/phoneEncyption';
import { encryptPinData } from '@/utils/pinEncryption';
import { fullFolderCleanup, getWalletFolders } from './wallet-api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://k33p-backend-i9kj.onrender.com/api';

// Token expiration check utility
export const isTokenExpired = (token: string): boolean => {
  try {
    // JWT tokens are in format: header.payload.signature
    const payload = token.split('.')[1];
    if (!payload) return true;

    // Decode base64 payload
    const decodedPayload = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );

    // Check if token has expiration time
    if (!decodedPayload.exp) return true;

    // Convert expiration time to milliseconds and compare with current time
    const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    // Add 5 minute buffer to handle network delays
    const bufferTime = 5 * 60 * 1000;
    return currentTime >= (expirationTime - bufferTime);
  } catch (error) {
    console.log('Error decoding token:', error);
    return true; // If we can't decode, assume expired
  }
};

// Enhanced generic request function with token validation
async function makeRequest(method: string, endpoint: string, data?: any, requiresAuth: boolean = true) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if required
  if (requiresAuth) {
    const { token, clearAuthData } = useAuthStore.getState();
    
    if (!token) {
      throw new Error('Authentication required: No token found');
    }

    // Check if token is expired before making request
    if (isTokenExpired(token)) {
      console.log('Token is expired, clearing auth data');
      clearAuthData();
      throw new Error('Authentication required: Token expired');
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    const responseData = await response.json();
    
    // Check for 401 Unauthorized response
    if (response.status === 401) {
      const { clearAuthData } = useAuthStore.getState();
      console.log('Received 401 response, clearing auth data');
      clearAuthData();
      throw new Error('Authentication required: Session expired');
    }

    return {
      status: response.status,
      body: responseData,
    };
  } catch (error: any) {
    // Re-throw authentication errors as-is
    if (error.message.includes('Authentication required')) {
      throw error;
    }
    throw new Error(`API request failed: ${error.message}`);
  }
}

export async function makeAuthenticatedRequest(
  method: string, 
  endpoint: string, 
  data?: any
) {
  return await makeRequest(method, endpoint, data, true);
}

export async function makePublicRequest(
  method: string, 
  endpoint: string, 
  data?: any
) {
  return await makeRequest(method, endpoint, data, false);
}

// Check token validity
export async function validateToken(): Promise<{ isValid: boolean; message?: string }> {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    return { isValid: false, message: 'No token found' };
  }

  if (isTokenExpired(token)) {
    return { isValid: false, message: 'Token expired' };
  }

  // Optional: Make a test API call to verify token is still valid on server
  try {
    const response = await makeRequest('GET', '/auth/validate-token', undefined, true);
    return { isValid: response.status === 200 };
  } catch (error: any) {
    return { isValid: false, message: error.message };
  }
}

// ZK Proof APIs
export async function generateZKCommitment(phone: string, biometric: string, passkey: string) {
  const payload = {
    phone,
    biometric,
    passkey
  };

  const response = await makePublicRequest('POST', '/zk/commitment', payload);
  
  if (response.body?.data?.commitment) {
    return response.body.data.commitment;
  } else {
    throw new Error(response.body?.error?.message || response.body?.message || 'Failed to generate ZK commitment');
  }
}

export async function generateZKProof(phone: string, biometric: string, passkey: string, commitment: string) {
  const payload = {
    phone,
    biometric,
    passkey,
    commitment
  };

  const response = await makePublicRequest('POST', '/zk/proof', payload);
  
  if (response.body?.data?.proof) {
    return response.body.data.proof;
  } else {
    throw new Error(response.body?.error?.message || response.body?.message || 'Failed to generate ZK proof');
  }
}

// Refund APIs
export async function initiateRefund(userAddress: string) {
  const payload = { userAddress };
  
  const response = await makePublicRequest('POST', '/refund', payload);
  
  if (response.body?.success) {
    return response.body.data;
  } else {
    throw new Error(response.body?.message || 'Failed to initiate refund');
  } 

    
}

export async function completeRefund(userAddress: string, walletAddress: string) {
  const payload = { userAddress, walletAddress };
  
  const response = await makePublicRequest('POST', '/refund', payload);
  
  if (response.body?.success) {
    return response.body.data;
  } else {
    throw new Error(response.body?.message || 'Failed to complete refund');
  }
}

// Auth APIs
export async function signupUser(signupData: {
  userId: string;
  userAddress: string;
  phoneHash: string;
  pinHash: string;
  authMethods: any[];
  zkCommitment: string;
  zkProof: any;
  verificationMethod: string;
}) {
  const response = await makePublicRequest('POST', '/auth/signup', signupData);
  
  if (response.status === 200 && response.body) {
    return response.body;
  } else {
    const errorMessage = response.body?.error?.message || 
                        response.body?.message || 
                        'Account creation failed';
    throw new Error(errorMessage);
  }
}

// Username APIs
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const response = await makeAuthenticatedRequest('GET', `/auth/username/check/${username}`);
    
    if (response.body?.success) {
      console.log('Username availability check:', {
        username: response.body.data.username,
        available: response.body.data.available,
        message: response.body.data.message
      });
      return response.body.data.available;
    } else {
      console.log('Username check failed:', response.body?.error?.message);
      return false;
    }
  } catch (error: any) {
    console.log('Username check request failed:', error.message);
    return false;
  }
}

export async function deleteUserWithWallets(retries = 3): Promise<boolean> {
  const { token, clearAuthData } = useAuthStore.getState();
  if (!token) {
    console.log('No auth token available for deleting user');
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // 1. Clean up folders and wallets
      const cleanupResult = await fullFolderCleanup();
      if (!cleanupResult.success) {
        console.warn(`Attempt ${attempt} - Folder cleanup failed:`, cleanupResult.message);
      }

      // 2. Get wallet IDs if needed
      const foldersResponse = await getWalletFolders();
      const walletIds: string[] = [];
      if (foldersResponse.success && foldersResponse.data?.folders) {
        foldersResponse.data.folders.forEach(folder => {
          folder.items.forEach(wallet => walletIds.push(wallet.id));
        });
      }
      console.log('Wallet IDs before deletion:', walletIds);

      // 3. Attempt deletion
      const response = await makeAuthenticatedRequest('DELETE', '/auth/user');

      if (response.body?.success) {
        console.log('User deleted successfully');
        return true;
      }

      // Handle API errors
      const errorMessage = response.body?.error?.message || response.body?.message || 'Failed to delete user';
      console.warn(`Attempt ${attempt} - User deletion failed:`, errorMessage);

      // Handle rate limit
      if (response.body?.code === 'RATE_LIMIT_EXCEEDED' && response.body.retryAfter) {
        const waitTime = Number(response.body.retryAfter) * 1000;
        console.log(`Rate limit exceeded. Retrying after ${waitTime / 1000}s...`);
        await new Promise(res => setTimeout(res, waitTime));
      } else {
        // Normal retry wait
        await new Promise(res => setTimeout(res, 1000));
      }

    } catch (error: any) {
      console.error(`Attempt ${attempt} - Delete user request failed:`, error.message);
      if (error.message.includes('Authentication required')) {
        clearAuthData();
        return false; // stop retrying if unauthorized
      }
    }
  }

  console.error('All deletion attempts failed.');
  return false;
}



// Delete current user account
export async function deleteUser(): Promise<{
  message: string;
  userId: string;
  timestamp: string;
} | null> {
  const { token, clearAuthData } = useAuthStore.getState();

  if (!token) {
    console.log('No auth token available for deleting user');
    return null;
  }

  try {
    const response = await makeAuthenticatedRequest('DELETE', '/auth/user');

    if (response.body?.success) {
      console.log('User deletion successful:', response.body.data);

      // Clear auth data after successful deletion
      clearAuthData();

      return response.body.data;
    } else {
      const errorMessage = response.body?.error?.message || response.body?.message || 'Failed to delete user';
      console.log('User deletion failed:', errorMessage);
      return null;
    }
  } catch (error: any) {
    console.log('Delete user request failed:', error.message);

    // Clear auth if token expired or unauthorized
    if (error.message.includes('Authentication required')) {
      clearAuthData();
    }

    return null;
  }
}


export async function setupUsername(username: string): Promise<boolean> {
  const { token, setToken, setUsername } = useAuthStore.getState();
  
  if (!token) {
    console.log('No auth token available for username setup');
    return false;
  }

  try {
    const usernameData = { username };
    const response = await makeAuthenticatedRequest('POST', '/auth/setup-username', usernameData);
    
    if (response.body?.success) {
      console.log('Username setup successful:', response.body.data.username);
      
      // Update token if provided in response
      if (response.body.data.token) {
        setToken(response.body.data.token);
        console.log('Token updated with username information');
      }
      
      // Save username to store
      setUsername(username);
      
      return true;
    } else {
      console.log('Username setup failed:', response.body?.error?.message);
      return false;
    }
  } catch (error: any) {
    console.log('Username setup request failed:', error.message);
    return false;
  }
}

// Get current user's username
export async function getUsername(): Promise<{
  userId: string;
  username: string | null;
  walletAddress: string;
  exists: boolean;
  hasUsername: boolean;
} | null> {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    console.log('No auth token available for getting username');
    return null;
  }

  try {
    const response = await makeAuthenticatedRequest('GET', '/auth/username');
    
    if (response.body?.success) {
      console.log('Username retrieved successfully:', {
        userId: response.body.data.userId,
        username: response.body.data.username,
        hasUsername: response.body.data.hasUsername
      });
      
      return response.body.data;
    } else {
      console.log('Get username failed:', response.body?.error?.message);
      return null;
    }
  } catch (error: any) {
    console.log('Get username request failed:', error.message);
    return null;
  }
}

// Update username
export async function updateUsername(username: string): Promise<{
  userId: string;
  username: string;
  walletAddress: string;
  updatedAt: string;
} | null> {
  const { token, setUsername } = useAuthStore.getState();
  
  if (!token) {
    console.log('No auth token available for updating username');
    return null;
  }

  try {
    // Validate username format client-side first
    if (username.length < 3 || username.length > 30) {
      throw new Error('Username must be between 3 and 30 characters');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    const usernameData = { username };
    const response = await makeAuthenticatedRequest('PUT', '/auth/username', usernameData);
    
    if (response.body?.success) {
      console.log('Username updated successfully:', response.body.data.username);
      
      // Update username in store
      setUsername(username);
      
      return response.body.data;
    } else {
      const errorMessage = response.body?.error?.message || 
                          response.body?.message || 
                          'Failed to update username';
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.log('Update username request failed:', error.message);
    throw error; // Re-throw to let caller handle
  }
}

// Helper function to create auth methods
export function createAuthMethods(phoneNumber: string, pin: string, userId: string) {
  const phoneHash = encryptPhoneData(phoneNumber);
  const pinHash = encryptPinData(pin, userId);
  
  return [
    {
      type: 'pin',
      data: pinHash,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    },
    {
      type: 'fingerprint', 
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    },
    {
      type: 'phone',
      data: phoneHash,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }
  ];
}

export async function updatePin(pinHash: string): Promise<{
  success: boolean;
  data?: {
    userId: string;
    updatedAt: string;
    pinUpdated: boolean;
    authMethodsUpdated: boolean;
    message: string;
  };
  message?: string;
  error?: string;
}> {
  try {
    // Validate PIN hash format client-side
    if (!pinHash || typeof pinHash !== 'string') {
      return {
        success: false,
        error: 'PIN hash is required'
      };
    }

    if (pinHash.length < 10) {
      return {
        success: false,
        error: 'Invalid PIN hash format'
      };
    }

    console.log('🔄 Updating PIN...');
    
    const response = await makeAuthenticatedRequest('PUT', '/auth/update-pin', { pinHash });
    
    if (response.body?.success) {
      console.log('✅ PIN updated successfully:', {
        userId: response.body.data?.userId,
        updatedAt: response.body.data?.updatedAt
      });
      
      return {
        success: true,
        data: response.body.data,
        message: response.body.message || 'PIN updated successfully'
      };
    } else {
      console.log('❌ PIN update failed:', response.body?.error?.message);
      
      return {
        success: false,
        error: response.body?.error?.message || response.body?.message || 'Failed to update PIN',
        message: response.body?.message || 'Failed to update PIN'
      };
    }
  } catch (error: any) {
    console.log('💥 PIN update request failed:', error.message);
    
    // Handle specific error cases
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
        message: 'Your session has expired. Please login again.'
      };
    }
    
    if (error.message.includes('Token expired')) {
      return {
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to update PIN',
      message: 'Failed to update PIN. Please try again.'
    };
  }
}