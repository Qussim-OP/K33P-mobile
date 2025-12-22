import { FOLDER, INFO, LOCK, PROFILE } from '@/assets/images/svg';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/useAuthMethod';
import { usePhoneStore } from '@/store/usePhoneStore';
import { usePinStore } from '@/store/usePinStore';
import { getUsername } from '@/utils/api';
import { getSubscriptionStatus } from '@/utils/payment';
import {
  createFolder,
  getWalletFolders,
  removeWalletFromFolder,
  type Folder,
  type WalletItem
} from '@/utils/wallet-api';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Wallet {
  id: string;
  name: string;
  keyType?: '12' | '24';
  fileId?: string;
  folderId?: string;
}

interface SubscriptionInfo {
  tier: 'freemium' | 'premium';
  isActive: boolean;
  maxFreeWallets: number;
}

export default function Index() {
  const [addWalletModalVisible, setAddWalletModalVisible] = useState(false);
  const [walletActionModalVisible, setWalletActionModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  const [defaultFolderId, setDefaultFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingUsername, setIsFetchingUsername] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    tier: 'freemium',
    isActive: false,
    maxFreeWallets: 2
  });
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [scanDeviceMessage, setScanDeviceMessage] = useState(false); // State for scan device message

  const params = useLocalSearchParams();
  const router = useRouter();
  const { phoneNumber } = usePhoneStore();
  const { pin, hasPin } = usePinStore();
  const { username, setUsername } = useAuthStore();
  const [isDeletingWallet, setIsDeletingWallet] = useState(false); // ADD THIS STATE

  // Monitor store hydration
  useEffect(() => {
    const unsubscribe = usePinStore.persist.onFinishHydration(() => {
      setIsStoreHydrated(true);
      console.log('Zustand Pin Store Hydrated!');
    });

    if (usePinStore.persist.hasHydrated()) {
      setIsStoreHydrated(true);
      console.log('Zustand Pin Store already hydrated on mount.');
    }

    return () => unsubscribe();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Effect to handle redirection if phone number or PIN is missing AFTER hydration
  useEffect(() => {
    if (!isStoreHydrated) return;

    if (!phoneNumber || (hasPin && pin === null) || (!hasPin && pin === null && router.canGoBack())) {
      console.warn('Phone number or PIN status requires re-authentication.');
      Alert.alert(
        "Session Expired",
        "Your session has expired or login details are missing. Please sign in again.",
        [{ text: "OK", onPress: () => router.replace('/sign-in') }]
      );
    }
  }, [phoneNumber, pin, hasPin, isStoreHydrated, router]);

  // Fetch username from API if it's empty in store
  const fetchUsernameFromAPI = async () => {
    if (!isStoreHydrated || username) return;

    console.log('Username is empty in store, fetching from API...');
    setIsFetchingUsername(true);
    
    try {
      const userData = await getUsername();
      
      if (userData && userData.username) {
        console.log('Username fetched from API:', userData.username);
        setUsername(userData.username);
      } else if (userData && !userData.username) {
        console.log('User exists but no username set in API');
      } else {
        console.log('Failed to fetch username from API');
      }
    } catch (error) {
      console.error('Error fetching username from API:', error);
    } finally {
      setIsFetchingUsername(false);
    }
  };

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    if (!isStoreHydrated) return;
    
    console.log('Checking subscription status...');
    setIsCheckingSubscription(true);
    
    try {
      const subscriptionResponse = await getSubscriptionStatus();
      
      if (subscriptionResponse.success && subscriptionResponse.data) {
        const { tier, isActive } = subscriptionResponse.data;
        setSubscriptionInfo({
          tier,
          isActive,
          maxFreeWallets: 2 // Free users can have 2 wallets with full functionality
        });
        console.log('Subscription status:', { tier, isActive });
      } else {
        console.log('Failed to get subscription status, defaulting to freemium');
        setSubscriptionInfo({
          tier: 'freemium',
          isActive: false,
          maxFreeWallets: 2
        });
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionInfo({
        tier: 'freemium',
        isActive: false,
        maxFreeWallets: 2
      });
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  // Convert WalletItem from API to local Wallet format
  const convertWalletItemToWallet = (walletItem: WalletItem, folderId: string): Wallet => ({
    id: walletItem.id,
    name: walletItem.name,
    keyType: walletItem.keyType,
    fileId: walletItem.fileId,
    folderId: folderId
  });

  // Load wallets and ensure default folder exists
  const loadWalletsAndEnsureFolder = async () => {
    if (!isStoreHydrated) return;

    console.log('Loading wallets and ensuring default folder...');
    setIsLoading(true);
    
    try {
      const response = await getWalletFolders();
      
      if (response.success && response.data) {
        console.log('WalletFolders - Folders loaded from API:', response.data.folders);
        setFolders(response.data.folders);
        
        // Extract all wallets from all folders
        const allWallets: Wallet[] = [];
        response.data.folders.forEach(folder => {
          folder.items.forEach(walletItem => {
            allWallets.push(convertWalletItemToWallet(walletItem, folder.id));
          });
        });
        
        console.log('WalletFolders - All wallets loaded from API:', allWallets);
        setWallets(allWallets);

        // Set default folder ID - use first folder or create one if none exists
        if (response.data.folders.length > 0) {
          const firstFolder = response.data.folders[0];
          setDefaultFolderId(firstFolder.id);
          console.log('Default folder ID set:', firstFolder.id);
        } else {
          // Create default folder if none exists
          console.log('No folders found, creating default folder...');
          const createFolderResponse = await createFolder('K33P Wallets');
          
          if (createFolderResponse.success && createFolderResponse.data) {
            console.log('Default folder created successfully:', createFolderResponse.data.id);
            setDefaultFolderId(createFolderResponse.data.id);
          } else {
            console.log('Failed to create default folder');
            Alert.alert('Error', 'Failed to create wallet folder. Please try again.');
          }
        }
      } else {
        console.log('WalletFolders - Failed to load folders from API:', response.message);
        setWallets([]);
        setFolders([]);
        
        // Try to create default folder even if fetch fails
        const createFolderResponse = await createFolder('K33P Wallets');
        if (createFolderResponse.success && createFolderResponse.data) {
          setDefaultFolderId(createFolderResponse.data.id);
        }
      }
    } catch (error) {
      console.error('WalletFolders - Error loading wallets from API:', error);
      setWallets([]);
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if wallet is locked (for free tier users beyond limit)
  const isWalletLocked = (walletIndex: number): boolean => {
    if (subscriptionInfo.tier === 'premium' && subscriptionInfo.isActive) {
      return false; // Premium users have no locks
    }
    
    // For free users, wallets beyond the first 2 are locked
    return walletIndex >= subscriptionInfo.maxFreeWallets;
  };

  // Initialize data when store is hydrated
  useEffect(() => {
    if (isStoreHydrated) {
      const initializeData = async () => {
        await fetchUsernameFromAPI();
        await checkSubscriptionStatus();
        await loadWalletsAndEnsureFolder();
      };
      initializeData();
    }
  }, [isStoreHydrated]);

  useFocusEffect(
    useCallback(() => {
      if (isStoreHydrated) {
        const refreshData = async () => {
          await fetchUsernameFromAPI();
          await checkSubscriptionStatus();
          await loadWalletsAndEnsureFolder();
        };
        refreshData();
      }
      return () => {};
    }, [isStoreHydrated])
  );

  useEffect(() => {
    if (!isStoreHydrated) return;

    if (params.updatedWallet) {
      try {
        const updatedWallet = JSON.parse(params.updatedWallet as string) as Wallet;
        console.log('WalletFolders - Processing updatedWallet param:', updatedWallet);
        loadWalletsAndEnsureFolder();
      } catch (e) {
        console.error('WalletFolders - Error parsing updated wallet from params:', e);
      }
    }
  }, [params.updatedWallet, isStoreHydrated]);

  useEffect(() => {
    if (!isStoreHydrated) return;

    if (params.newWallets) {
      try {
        const newlyAddedWallets: Wallet[] = JSON.parse(params.newWallets as string);
        console.log('WalletFolders - Processing newWallets param:', newlyAddedWallets);
        loadWalletsAndEnsureFolder();
      } catch (e) {
        console.error('WalletFolders - Error parsing new wallets from params:', e);
      }
    }
  }, [params.newWallets, isStoreHydrated]);

  const openAddWalletModal = () => {
    setScanDeviceMessage(false); 
    if (!defaultFolderId) {
      Alert.alert('Please Wait', 'Setting up your wallet folder...');
      return;
    }
    setAddWalletModalVisible(true);
  };

  const closeAddWalletModal = () => setAddWalletModalVisible(false);

  const openWalletActionModal = (wallet: Wallet, walletIndex: number) => {
    // Don't open action modal for locked wallets
    if (isWalletLocked(walletIndex)) {
      Alert.alert(
        'Upgrade Required',
        'Free users can only add key phrases to the first 2 wallets. Upgrade to premium to unlock all features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/profile/manage-subscription') }
        ]
      );
      return;
    }
    setSelectedWallet(wallet);
    setWalletActionModalVisible(true);
  };

  const closeWalletActionModal = () => {
    setSelectedWallet(null);
    setWalletActionModalVisible(false);
  };

  // Navigation functions with folder ID
  const navigateToScanDevice = useCallback(() => {
    setScanDeviceMessage(true);

/*     closeAddWalletModal();
    if (defaultFolderId) {
      router.push({
        pathname: '/search',
        params: { folderId: defaultFolderId }
      });
    } else {
      Alert.alert('Error', 'Folder ID not available. Please try again.');
    }
 */  }, [/* defaultFolderId, router */]);

  const navigateToAddManually = useCallback(() => {
    closeAddWalletModal();
    if (defaultFolderId) {
      router.push({
        pathname: '/add-manually',
        params: { folderId: defaultFolderId }
      });
    } else {
      Alert.alert('Error', 'Folder ID not available. Please try again.');
    }
  }, [defaultFolderId, router]);

  const handleRemoveWallet = async () => {
    if (!selectedWallet) return;
  
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to remove ${selectedWallet.name} and its associated key phrases? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => closeWalletActionModal(),
        },
        {
          text: "Delete",
          onPress: async () => {
            console.log('WalletFolders - Attempting to remove wallet:', selectedWallet.name);
            setIsDeletingWallet(true); // START LOADING
            
            try {
              if (selectedWallet.fileId) {
                try {
                  const response = await fetch('https://k33p-backend.onrender.com/api/v1/vault/delete', {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ file_id: selectedWallet.fileId }),
                  });
  
                  const responseData = await response.json();
  
                  if (response.ok && responseData.status === 'success') {
                    console.log('WalletFolders - File deleted from backend successfully:', responseData.message);
                    // Don't show alert here to avoid interrupting the flow
                  } else {
                    console.error('WalletFolders - Failed to delete file from backend:', responseData.message || 'Unknown error');
                    // We'll show a consolidated alert at the end
                  }
                } catch (error) {
                  console.error('WalletFolders - Network or API error during file deletion:', error);
                  // We'll show a consolidated alert at the end
                }
              } else {
                console.log('WalletFolders - No fileId found for wallet, skipping backend deletion.');
              }
  
              // Remove wallet from folder using API
              if (selectedWallet.folderId) {
                try {
                  const removeResponse = await removeWalletFromFolder(
                    selectedWallet.folderId, 
                    selectedWallet.id
                  );
  
                  if (removeResponse.success) {
                    console.log('WalletFolders - Wallet removed from folder via API');
                    
                    // Update local state
                    const updatedWallets = wallets.filter(w => w.id !== selectedWallet.id);
                    setWallets(updatedWallets);
                    
                    // Also update folders state
                    const updatedFolders = folders.map(folder => {
                      if (folder.id === selectedWallet.folderId) {
                        return {
                          ...folder,
                          items: folder.items.filter(item => item.id !== selectedWallet.id)
                        };
                      }
                      return folder;
                    });
                    setFolders(updatedFolders);
                    
                    // Check if no wallets remain after deletion
                    if (updatedWallets.length === 0) {
                      console.log('WalletFolders - No wallets remaining, redirecting to home screen');
                      setTimeout(() => {
                        router.replace('/(home)');
                      }, 500);
                    }
                    
                    Alert.alert('Success', `${selectedWallet.name} has been removed successfully.`);
                    
                  } else {
                    console.error('WalletFolders - Failed to remove wallet from folder via API:', removeResponse.message);
                    Alert.alert('Error', `Failed to remove wallet: ${removeResponse.message || 'Please try again.'}`);
                  }
                } catch (error) {
                  console.error('WalletFolders - Error removing wallet from folder via API:', error);
                  Alert.alert('Error', 'Failed to remove wallet. Please try again.');
                }
              } else {
                console.warn('WalletFolders - No folderId found for wallet, cannot remove via API');
                const updatedWallets = wallets.filter(w => w.id !== selectedWallet.id);
                setWallets(updatedWallets);
                
                if (updatedWallets.length === 0) {
                  console.log('WalletFolders - No wallets remaining, redirecting to home screen');
                  setTimeout(() => {
                    router.replace('/(home)');
                  }, 500);
                }
                
                Alert.alert('Success', `${selectedWallet.name} has been removed successfully.`);
              }
              
            } catch (error) {
              console.error('WalletFolders - Unexpected error during wallet removal:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            } finally {
              setIsDeletingWallet(false); // STOP LOADING
              closeWalletActionModal();
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const walletRows = [];
  for (let i = 0; i < wallets.length; i += 2) {
    walletRows.push(wallets.slice(i, i + 2));
  }

  // Display name logic
  const displayName = username || 'User';

  if (!isStoreHydrated || isLoading || isCheckingSubscription) {
    return (
      <View className="flex-1  justify-center items-center">
        <Text className="text-white text-lg font-sora">Loading your wallets...</Text>
        {!defaultFolderId && (
          <Text className="text-neutral200 text-sm mt-2 font-sora">Setting up your wallet folder...</Text>
        )}
        {isFetchingUsername && (
          <Text className="text-neutral200 text-sm mt-1 font-sora">Fetching user info...</Text>
        )}
        {isCheckingSubscription && (
          <Text className="text-neutral200 text-sm mt-1 font-sora">Checking subscription...</Text>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 b px-4 pt-6 relative">
      <TouchableOpacity onPress={() => router.push('/support')} className="absolute left-4">
        <INFO
          style={{
            left: '50%',
            transform: [{ translateX: '-50%' }],
          }}
        />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/profile')} className="absolute right-4">
        <PROFILE
          style={{
            left: '50%',
            transform: [{ translateX: '-50%' }],
          }}
        />      
      </TouchableOpacity>

      <View style={{ marginTop: 40 }}>
        <View className='px-2 mb-4'>
          <Text className='text-white font-sora mb-2'>Hello {displayName}</Text>
          <Text className='text-[#B8B8B8] font-space-mono text-xs'>
            {getGreeting()}, and welcome to K33P.
          </Text>
        </View>
      </View>

      <View className="flex-1 justify-center mt-2">
        {wallets.length > 0 ? (
          <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
            {walletRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} className="flex-row justify-around mb-8">
                {row.map((wallet, walletIndexInRow) => {
                  const absoluteIndex = rowIndex * 2 + walletIndexInRow;
                  const isLocked = isWalletLocked(absoluteIndex);
                  
                  return (
                    <TouchableOpacity
                      key={wallet.id}
                      onPress={() => openWalletActionModal(wallet, absoluteIndex)}
                      className="items-center w-1/2 px-2"
                    >
                      <View className="items-center relative">
                        <View className={`items-center ${isLocked ? 'opacity-60' : ''}`}>
                          <FOLDER />
                          <Text className="text-white font-sora text-base text-center mb-1 mt-5">
                            {wallet.keyType ? `${wallet.keyType} Keys` : 'Add Key Phrases'}
                          </Text>
                          <Text className="text-neutral100 font-sora text-sm text-center">
                            {wallet.name}
                          </Text>
                        </View>
                        {isLocked && (
                          <View className="absolute inset-0 bg-mainBlack/80 rounded-2xl items-center pt-10 ">
                            <LOCK width={35} height={35} fill="#FFD700"  />
                            <Text className="text-white font-sora-bold text-sm text-center mt-2">
                              Upgrade
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {row.length === 1 && <View className="w-1/2 px-2" />}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View className="items-center justify-center">
            <Text className="text-white font-sora-semibold text-lg text-center mb-4">
              No wallets selected yet
            </Text>
            <Text className="text-neutral200 font-sora text-sm text-center">
              Add wallets to get started
            </Text>
          </View>
        )}
      </View>

      {/* Add Wallet Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={addWalletModalVisible}
        onRequestClose={closeAddWalletModal}
      >
        <Pressable onPress={closeAddWalletModal} className="absolute inset-0 bg-black/70" />
        <View className="flex-1 justify-center items-center">
          <View className="bg-mainBlack rounded-3xl p-6 w-4/5">
            <Text className="text-white font-sora text-sm text-center mb-6">
              How do you want to add wallet
            </Text>
            <View className="space-y-4 gap-4">
              <Button
                text="Scan Device"
                onPress={navigateToScanDevice}
              />
               
              <Button
                text="Add Manually"
                onPress={navigateToAddManually}
                outline
              />
              {scanDeviceMessage && (
                <View className="px-4 py-2">
                  <Text className="text-neutral200 font-sora text-xs text-center">
                    This feature is currently unavailable. Please add manually.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Wallet Action Modal */}
      <Modal
  animationType="fade"
  transparent
  visible={walletActionModalVisible}
  onRequestClose={closeWalletActionModal}
>
  <Pressable onPress={closeWalletActionModal} className="absolute inset-0 bg-black/80" />
  <View className="flex-1 justify-center items-center">
    <View className="bg-mainBlack rounded-3xl p-6 w-4/5">
      <View className="space-y-4 gap-4">
        {isDeletingWallet ? (
          // SHOW ONLY LOADER WHEN DELETING
          <View className="items-center py-4">
            <ActivityIndicator size="large" color="#FF3B30" />
            <Text className="text-neutral200 text-base mt-4 font-sora text-center">
              Removing {selectedWallet?.name}...
            </Text>
            <Text className="text-neutral300 text-sm mt-2 font-sora text-center">
              Please wait while we delete the wallet and key phrases
            </Text>
          </View>
        ) : (
          // SHOW NORMAL BUTTONS WHEN NOT DELETING
          <>
            <Button
              text={selectedWallet?.keyType ? 'View Key Phrases' : 'Add Key Phrases'}
              onPress={() => {
                closeWalletActionModal();
                if (selectedWallet?.keyType) {
                  router.push({
                    pathname: "/(home)/view-key-phrases",
                    params: {
                      fileId: selectedWallet?.fileId || '',
                    }
                  });
                } else {
                  router.push({
                    pathname: "/(home)/add-key-phrases",
                    params: {
                      walletId: selectedWallet?.id,
                      walletName: selectedWallet?.name,
                      walletFileId: selectedWallet?.fileId || '',
                      walletKeyType: selectedWallet?.keyType || '',
                      walletFolderId: selectedWallet?.folderId || '',
                    }
                  });
                }
              }}
            />
            <Button
              text="Remove Wallet"
              onPress={handleRemoveWallet}
              danger
            />
          </>
        )}
      </View>
    </View>
  </View>
</Modal>

      {/* Connect Section */}
      <View className="bg-[#222222] px-4 pt-8 pb-8 mb-16 rounded-3xl mt-">
        <View className="items-center mb-4">
          <Text className="text-neutral200 font-sora-semibold text-sm">Connect</Text>
        </View>
        <Button
          text={wallets.length > 0 ? "Add Another Wallet" : "Add New Wallet"}
          onPress={openAddWalletModal}
          loading={!defaultFolderId}
          disabled={!defaultFolderId}
        />
        {!defaultFolderId && (
          <Text className="text-neutral200 text-xs text-center mt-2">
            Setting up your wallet folder...
          </Text>
        )}
      </View>
    </View>
  );
}