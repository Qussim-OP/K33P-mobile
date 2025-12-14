import { useAuthStore } from '@/store/useAuthMethod';

export interface WalletItem {
  id: string;
  name: string;
  type: 'wallet';
  keyType?: '12' | '24';
  fileId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  items: WalletItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AddWalletRequest {
  name: string;
  keyType?: '12' | '24';
  fileId?: string;
}

export interface UpdateWalletRequest {
  name?: string;
  keyType?: '12' | '24';
  fileId?: string;
}

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthToken = (): string => {
  const token = useAuthStore.getState().token;
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

export const walletFoldersAPI = {
  async createWalletFolder(name?: string): Promise<Folder> {
    const authToken = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/wallet-folders/folders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(name ? { name } : {}),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create wallet folder');
    }
    
    const data: ApiResponse<Folder> = await response.json();
    return data.data;
  },

  async getWalletFolder(): Promise<Folder | null> {
    const authToken = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/wallet-folders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch wallet folder');
    }
    
    const data: ApiResponse<{ folders: Folder[] }> = await response.json();
    return data.data.folders?.[0] || null;
  },

  async ensureWalletFolder(): Promise<Folder> {
    const existingFolder = await this.getWalletFolder();
    if (existingFolder) return existingFolder;
    return await this.createWalletFolder();
  },

  async addWallet(walletData: AddWalletRequest): Promise<WalletItem> {
    const authToken = getAuthToken();
    const folder = await this.ensureWalletFolder();
    
    const response = await fetch(`${API_BASE_URL}/wallet-folders/folders/${folder.id}/wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(walletData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add wallet');
    }
    
    const data: ApiResponse<WalletItem> = await response.json();
    return data.data;
  },

  async getWallets(): Promise<WalletItem[]> {
    const folder = await this.getWalletFolder();
    return folder?.items || [];
  },

  async updateWallet(walletId: string, updates: UpdateWalletRequest): Promise<WalletItem> {
    const authToken = getAuthToken();
    const folder = await this.getWalletFolder();
    
    if (!folder) {
      throw new Error('No wallet folder found');
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet-folders/folders/${folder.id}/wallets/${walletId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update wallet');
    }
    
    const data: ApiResponse<WalletItem> = await response.json();
    return data.data;
  },

  async deleteWallet(walletId: string): Promise<void> {
    const authToken = getAuthToken();
    const folder = await this.getWalletFolder();
    
    if (!folder) {
      throw new Error('No wallet folder found');
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet-folders/folders/${folder.id}/wallets/${walletId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete wallet');
    }
    
    await response.json();
  },
};