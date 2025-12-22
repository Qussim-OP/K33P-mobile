// utils/wallet-api.ts
import { useAuthStore } from '@/store/useAuthMethod';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://k33p-backend-i9kj.onrender.com/api';

// Types
export interface Folder {
  id: string;
  name: string;
  items: WalletItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletItem {
  id: string;
  name: string;
  type: 'wallet';
  keyType?: '12' | '24';
  fileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFolderRequest {
  name?: string;
}

export interface AddWalletRequest {
  name: string;
  // keyType and fileId are optional when creating
}

export interface UpdateWalletRequest {
  name?: string;
  keyType?: '12' | '24';
  fileId?: string;
}

export interface UpdateWalletRecoveryRequest {
  keyType: '12' | '24';
  fileId: string;
}

export interface WalletFoldersResponse {
  success: boolean;
  data?: {
    folders: Folder[];
    totalWallets: number;
  };
  message?: string;
  error?: string;
}

export interface FolderResponse {
  success: boolean;
  data?: Folder;
  message?: string;
  error?: string;
}

export interface WalletResponse {
  success: boolean;
  data?: WalletItem;
  message?: string;
  error?: string;
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
 * Get all folders and wallets for the authenticated user
 */
export async function getWalletFolders(): Promise<WalletFoldersResponse> {
  try {
    const response = await makeRequest('GET', '/wallet-folders');
    
    if (response.body.success) {
      console.log('Wallet folders retrieved successfully:', {
        folderCount: response.body.data?.folders?.length || 0,
        totalWallets: response.body.data?.totalWallets || 0
      });
      return response.body;
    } else {
      console.log('Get wallet folders failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to fetch wallet folders'
      };
    }
  } catch (error: any) {
    console.log('Get wallet folders request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to fetch wallet folders'
    };
  }
}

/**
 * Create a new folder
 */
export async function createFolder(name?: string): Promise<FolderResponse> {
  try {
    const folderData: CreateFolderRequest = { name };
    const response = await makeRequest('POST', '/wallet-folders/folders', folderData);
    
    if (response.body.success) {
      console.log('Folder created successfully:', response.body.data?.name);
      return response.body;
    } else {
      console.log('Create folder failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to create folder'
      };
    }
  } catch (error: any) {
    console.log('Create folder request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to create folder'
    };
  }
}

export async function fullFolderCleanup() {
  try {
    // Step 1: get all folders
    const folderResp = await getWalletFolders();

    if (!folderResp.success || !folderResp.data) {
      return { success: false, message: "Could not fetch folders" };
    }

    const folders = folderResp.data.folders;

    // Step 2: loop through every folder
    for (const folder of folders) {
      const wallets = folder.items || [];

      // Step 3: loop through every wallet inside the folder
      for (const wallet of wallets) {
        // If wallet has vault data, delete file from vault
        if (wallet.fileId && wallet.keyType) {
          try {
            const res = await fetch("https://k33p-backend.onrender.com/api/v1/vault/delete", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ file_id: wallet.fileId }),
            });

            const data = await res.json();
            if (!res.ok || data.status !== "success") {
              console.warn("Vault delete failed for file:", wallet.fileId, data);
            }
          } catch (err) {
            console.error("Vault delete error:", err);
          }
        }

        // Remove wallet from folder
        await removeWalletFromFolder(folder.id, wallet.id);
      }

      // After removing all wallets, delete the folder
      await deleteFolder(folder.id);
    }

    return { success: true, message: "All folders and wallets cleaned up." };
  } catch (err: any) {
    console.error("Cleanup error:", err);
    return { success: false, message: err.message };
  }
}


/**
 * Add a wallet to a folder - Only name is required
 */
export async function addWalletToFolder(
  folderId: string, 
  walletData: AddWalletRequest
): Promise<WalletResponse> {
  try {
    // Validate required fields - only name is required
    if (!walletData.name || walletData.name.trim().length === 0) {
      return {
        success: false,
        message: 'Wallet name is required'
      };
    }

    if (walletData.name.trim().length > 100) {
      return {
        success: false,
        message: 'Wallet name must be less than 100 characters'
      };
    }

    const response = await makeRequest(
      'POST', 
      `/wallet-folders/folders/${folderId}/wallets`, 
      walletData
    );
    
    if (response.body.success) {
      console.log('Wallet added successfully:', response.body.data?.name);
      return response.body;
    } else {
      console.log('Add wallet failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to add wallet'
      };
    }
  } catch (error: any) {
    console.log('Add wallet request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to add wallet'
    };
  }
}

/**
 * Update a wallet - Can update name, keyType, and fileId
 */
export async function updateWallet(
  folderId: string,
  walletId: string,
  updates: UpdateWalletRequest
): Promise<WalletResponse> {
  try {
    // Validate inputs
    if (updates.name && updates.name.trim().length === 0) {
      return {
        success: false,
        message: 'Wallet name cannot be empty'
      };
    }

    if (updates.name && updates.name.trim().length > 100) {
      return {
        success: false,
        message: 'Wallet name must be less than 100 characters'
      };
    }

    if (updates.keyType && !['12', '24'].includes(updates.keyType)) {
      return {
        success: false,
        message: 'Key type must be either "12" or "24"'
      };
    }

    const response = await makeRequest(
      'PUT', 
      `/wallet-folders/folders/${folderId}/wallets/${walletId}`, 
      updates
    );
    
    if (response.body.success) {
      console.log('Wallet updated successfully:', response.body.data?.name);
      return response.body;
    } else {
      console.log('Update wallet failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to update wallet'
      };
    }
  } catch (error: any) {
    console.log('Update wallet request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to update wallet'
    };
  }
}

/**
 * Add recovery data to a wallet (keyType and fileId) via PATCH endpoint
 */
export async function addWalletRecoveryData(
  folderId: string,
  walletId: string,
  recoveryData: UpdateWalletRecoveryRequest
): Promise<WalletResponse> {
  try {
    // Validate required fields for recovery data
    if (!recoveryData.keyType || !recoveryData.fileId) {
      return {
        success: false,
        message: 'Both keyType and fileId are required for recovery data'
      };
    }

    if (!['12', '24'].includes(recoveryData.keyType)) {
      return {
        success: false,
        message: 'Key type must be either "12" or "24"'
      };
    }

    const response = await makeRequest(
      'PATCH', 
      `/wallet-folders/folders/${folderId}/wallets/${walletId}/recovery`, 
      recoveryData
    );
    
    if (response.body.success) {
      console.log('Wallet recovery data added successfully:', response.body.data?.name);
      return response.body;
    } else {
      console.log('Add wallet recovery data failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to add wallet recovery data'
      };
    }
  } catch (error: any) {
    console.log('Add wallet recovery data request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to add wallet recovery data'
    };
  }
}

/**
 * Remove a wallet from a folder
 */
export async function removeWalletFromFolder(
  folderId: string,
  walletId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await makeRequest(
      'DELETE', 
      `/wallet-folders/folders/${folderId}/wallets/${walletId}`
    );
    
    if (response.body.success) {
      console.log('Wallet removed successfully');
      return { success: true, message: response.body.message };
    } else {
      console.log('Remove wallet failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to remove wallet'
      };
    }
  } catch (error: any) {
    console.log('Remove wallet request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to remove wallet'
    };
  }
}

/**
 * Delete a folder and all its wallets
 */
export async function deleteFolder(folderId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await makeRequest(
      'DELETE', 
      `/wallet-folders/folders/${folderId}`
    );
    
    if (response.body.success) {
      console.log('Folder deleted successfully');
      return { success: true, message: response.body.message };
    } else {
      console.log('Delete folder failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to delete folder'
      };
    }
  } catch (error: any) {
    console.log('Delete folder request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to delete folder'
    };
  }
}

export async function deleteFolderWithVaultCleanup(folderId: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Get all folders
    const foldersResp = await getWalletFolders();
    if (!foldersResp.success || !foldersResp.data) {
      return { success: false, message: 'Failed to fetch folders before deletion' };
    }

    const folder = foldersResp.data.folders.find(f => f.id === folderId);
    if (!folder) {
      return { success: false, message: 'Folder not found' };
    }

    // Iterate through wallets that have recovery data
    for (const wallet of folder.items) {
      if (wallet.keyType && wallet.fileId) {
        try {
          const res = await fetch('https://k33p-backend.onrender.com/api/v1/vault/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_id: wallet.fileId }),
          });
          const data = await res.json();
          if (!res.ok || data.status !== 'success') {
            console.warn(`Failed to delete file ${wallet.fileId}:`, data.message);
          }
        } catch (error) {
          console.error(`Error deleting file ${wallet.fileId}:`, error);
        }
      }

      // Remove wallet from folder
      await removeWalletFromFolder(folderId, wallet.id);
    }

    // Finally delete the folder
    return await deleteFolder(folderId);

  } catch (error: any) {
    console.error('Error deleting folder with cleanup:', error);
    return { success: false, message: error.message || 'Failed to delete folder' };
  }
}


/**
 * Helper function to create a wallet with just name
 */
export function createWalletData(name: string): AddWalletRequest {
  return {
    name: name.trim()
  };
}

/**
 * Helper function to create recovery data
 */
export function createRecoveryData(keyType: '12' | '24', fileId: string): UpdateWalletRecoveryRequest {
  return {
    keyType,
    fileId
  };
}

/**
 * Helper function to validate folder name
 */
export function validateFolderName(name: string): { valid: boolean; message?: string } {
  if (name.length > 100) {
    return { valid: false, message: 'Folder name must be less than 100 characters' };
  }
  return { valid: true };
}

/**
 * Helper function to find folder by ID
 */
export function findFolderById(folders: Folder[], folderId: string): Folder | undefined {
  return folders.find(folder => folder.id === folderId);
}

/**
 * Helper function to find wallet by ID
 */
export function findWalletById(folders: Folder[], walletId: string): { folder: Folder; wallet: WalletItem } | null {
  for (const folder of folders) {
    const wallet = folder.items.find(item => item.id === walletId);
    if (wallet) {
      return { folder, wallet };
    }
  }
  return null;
}

/**
 * Helper function to check if wallet has recovery data
 */
export function hasRecoveryData(wallet: WalletItem): boolean {
  return !!(wallet.keyType && wallet.fileId);
}

/**
 * Helper function to get wallet recovery status
 */
export function getWalletRecoveryStatus(wallet: WalletItem): { hasRecovery: boolean; keyType?: string; fileId?: string } {
  return {
    hasRecovery: !!(wallet.keyType && wallet.fileId),
    keyType: wallet.keyType,
    fileId: wallet.fileId
  };
}