// utils/image-number-api.ts
import { useAuthStore } from '@/store/useAuthMethod';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://k33p-backend-i9kj.onrender.com/api';

// Types
export interface ImageNumberData {
  userId: string;
  imageNumber: number;
  availableNumbers: number[];
  description: string;
}

export interface ImageNumberPreview {
  number: number;
  name: string;
  description: string;
  isCurrent: boolean;
  previewUrl: string;
}

export interface ImageNumberPreviewResponse {
  userId: string;
  currentImageNumber: number;
  availableNumbers: number[];
  previews: ImageNumberPreview[];
  note: string;
}

export interface UpdateImageNumberRequest {
  imageNumber: number;
}

export interface ResetImageNumberRequest {
  confirm?: boolean;
}

export interface ImageNumberResponse {
  success: boolean;
  data?: ImageNumberData;
  message?: string;
  error?: string;
}

export interface ImageNumberPreviewApiResponse {
  success: boolean;
  data?: ImageNumberPreviewResponse;
  message?: string;
  error?: string;
}

export interface RandomImageNumberResponse {
  success: boolean;
  data?: {
    userId: string;
    oldImageNumber: number;
    newImageNumber: number;
    wasRandomized: boolean;
    updatedAt: string;
  };
  message?: string;
  error?: string;
}

export interface ResetImageNumberApiResponse {
  success: boolean;
  data?: {
    userId: string;
    oldImageNumber: number;
    newImageNumber: number;
    wasReset: boolean;
    updatedAt: string;
  };
  message?: string;
  error?: string;
  confirmationMessage?: string;
  confirmationEndpoint?: string;
  confirmationBody?: { confirm: boolean };
}

// Generic request function
async function makeRequest(method: string, endpoint: string, data?: any, requiresAuth: boolean = true) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if required
  if (requiresAuth) {
    const { token } = useAuthStore.getState();
    console.log('Token:', token);
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      throw new Error('Authentication required');
    }
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    const responseData = await response.json();
    
    return {
      status: response.status,
      body: responseData,
    };
  } catch (error: any) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Get current image number for authenticated user
 */
export async function getCurrentImageNumber(): Promise<ImageNumberResponse> {
  try {
    const response = await makeRequest('GET', '/image-number');
    
    if (response.body.success) {
      console.log('Image number retrieved successfully:', {
        imageNumber: response.body.data?.imageNumber,
        availableNumbers: response.body.data?.availableNumbers
      });
      return response.body;
    } else {
      console.log('Get image number failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to fetch image number'
      };
    }
  } catch (error: any) {
    console.log('Get image number request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to fetch image number'
    };
  }
}

/**
 * Update image number (1, 2, or 3)
 */
export async function updateImageNumber(imageNumber: number): Promise<ImageNumberResponse> {
  try {
    // Validate image number
    if (![1, 2, 3].includes(imageNumber)) {
      return {
        success: false,
        message: 'Image number must be 1, 2, or 3'
      };
    }

    const updateData: UpdateImageNumberRequest = { imageNumber };
    const response = await makeRequest('PUT', '/image-number', updateData);
    
    if (response.body.success) {
      console.log('Image number updated successfully:', {
        oldImageNumber: response.body.data?.oldImageNumber,
        newImageNumber: response.body.data?.newImageNumber
      });
      return response.body;
    } else {
      console.log('Update image number failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to update image number'
      };
    }
  } catch (error: any) {
    console.log('Update image number request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to update image number'
    };
  }
}

/**
 * Get image number previews
 */
export async function getImageNumberPreviews(): Promise<ImageNumberPreviewApiResponse> {
  try {
    const response = await makeRequest('GET', '/image-number/preview');
    
    if (response.body.success) {
      console.log('Image number previews retrieved successfully:', {
        currentImageNumber: response.body.data?.currentImageNumber,
        previewCount: response.body.data?.previews?.length || 0
      });
      return response.body;
    } else {
      console.log('Get image number previews failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to fetch image number previews'
      };
    }
  } catch (error: any) {
    console.log('Get image number previews request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to fetch image number previews'
    };
  }
}

/**
 * Set random image number
 */
export async function setRandomImageNumber(): Promise<RandomImageNumberResponse> {
  try {
    const response = await makeRequest('PUT', '/image-number/random', {});
    
    if (response.body.success) {
      console.log('Random image number set successfully:', {
        oldImageNumber: response.body.data?.oldImageNumber,
        newImageNumber: response.body.data?.newImageNumber,
        wasRandomized: response.body.data?.wasRandomized
      });
      return response.body;
    } else {
      console.log('Set random image number failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to set random image number'
      };
    }
  } catch (error: any) {
    console.log('Set random image number request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to set random image number'
    };
  }
}

/**
 * Reset image number to default (1)
 */
export async function resetImageNumber(confirm: boolean = false): Promise<ResetImageNumberApiResponse> {
  try {
    const resetData: ResetImageNumberRequest = { confirm };
    const response = await makeRequest('PUT', '/image-number/reset', resetData);
    
    if (response.body.success) {
      console.log('Image number reset successfully:', {
        oldImageNumber: response.body.data?.oldImageNumber,
        newImageNumber: response.body.data?.newImageNumber,
        wasReset: response.body.data?.wasReset
      });
      return response.body;
    } else if (response.body.error === 'CONFIRMATION_REQUIRED') {
      console.log('Reset confirmation required');
      return {
        success: false,
        message: response.body.message,
        error: 'CONFIRMATION_REQUIRED',
        confirmationMessage: response.body.confirmationMessage,
        confirmationEndpoint: response.body.confirmationEndpoint,
        confirmationBody: response.body.confirmationBody
      };
    } else if (response.body.error === 'ALREADY_DEFAULT') {
      console.log('Image number already at default');
      return {
        success: false,
        message: response.body.message,
        error: 'ALREADY_DEFAULT'
      };
    } else {
      console.log('Reset image number failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to reset image number'
      };
    }
  } catch (error: any) {
    console.log('Reset image number request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to reset image number'
    };
  }
}

/**
 * Helper function to validate image number
 */
export function validateImageNumber(imageNumber: number): { valid: boolean; message?: string } {
  if (![1, 2, 3].includes(imageNumber)) {
    return { valid: false, message: 'Image number must be 1, 2, or 3' };
  }
  return { valid: true };
}

/**
 * Helper function to get current preview from list
 */
export function getCurrentPreview(previews: ImageNumberPreview[]): ImageNumberPreview | undefined {
  return previews.find(preview => preview.isCurrent);
}

/**
 * Helper function to get preview by number
 */
export function getPreviewByNumber(previews: ImageNumberPreview[], number: number): ImageNumberPreview | undefined {
  return previews.find(preview => preview.number === number);
}

/**
 * Helper function to get next available image number
 */
export function getNextAvailableNumber(currentNumber: number): number {
  const numbers = [1, 2, 3];
  const available = numbers.filter(n => n !== currentNumber);
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Helper function to check if image number is default
 */
export function isDefaultImageNumber(imageNumber: number): boolean {
  return imageNumber === 1;
}

/**
 * Helper function to get image number display name
 */
export function getImageNumberDisplayName(number: number): string {
  const names: Record<number, string> = {
    1: 'Default Avatar',
    2: 'Alternate Avatar',
    3: 'Premium Avatar'
  };
  return names[number] || `Avatar ${number}`;
}

/**
 * Helper function to get image number description
 */
