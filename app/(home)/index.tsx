import Button from '@/components/Button';
import Carousel, { Slide } from '@/components/Carousel';
import { useAuthStore } from '@/store/useAuthMethod';
import { getUsername, isTokenExpired } from '@/utils/api'; // Import getUsername
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { usePhoneStore } from '@/store/usePhoneStore';
import { usePinStore } from '@/store/usePinStore';
import { createFolder, getWalletFolders } from '@/utils/wallet-api';

import { INFO, PROFILE } from '@/assets/images/svg';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function Index() {
  const [modalVisible, setModalVisible] = useState(false);
  const [carouselModalVisible, setCarouselModalVisible] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  const [isCheckingWallets, setIsCheckingWallets] = useState(true);
  const [defaultFolderId, setDefaultFolderId] = useState<string | null>(null);
  const [isFetchingUsername, setIsFetchingUsername] = useState(false);
  const [scanDeviceMessage, setScanDeviceMessage] = useState(false); // State for scan device message
  
  const router = useRouter();
  const { username, token, clearAuthData, setUsername } = useAuthStore();

  const { phoneNumber } = usePhoneStore();
  const { pin, hasPin } = usePinStore();

  // Fetch username from API if it's empty in store
  const fetchUsernameFromAPI = async () => {
    if (!isStoreHydrated || username) return; // Skip if we already have a username

    console.log('HomeScreen - Username is empty in store, fetching from API...');
    setIsFetchingUsername(true);
    
    try {
      const userData = await getUsername();
      
      if (userData && userData.username) {
        console.log('HomeScreen - Username fetched from API:', userData.username);
        setUsername(userData.username);
      } else if (userData && !userData.username) {
        console.log('HomeScreen - User exists but no username set in API');
        // Username is not set in backend either, keep as empty
      } else {
        console.log('HomeScreen - Failed to fetch username from API');
      }
    } catch (error) {
      console.error('HomeScreen - Error fetching username from API:', error);
    } finally {
      setIsFetchingUsername(false);
    }
  };

  // Check if token exists and is valid
  const checkTokenValidity = useCallback(async (): Promise<boolean> => {
    const { token, clearAuthData } = useAuthStore.getState();
    console.log(token);
    
    
    if (!token) {
      console.log('No token found');
      router.replace('/sign-in');
      return false;
    }
  
    // Use the utility function from api.ts
    if (isTokenExpired(token)) {
      console.log('Token is expired');
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please sign in again.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              clearAuthData();
              router.replace('/sign-in');
            }
          }
        ]
      );
      return false;
    }
  
    return true;
  }, [router]);
  
  const checkWalletFolders = useCallback(async () => {
    try {
      setIsCheckingWallets(true);
      
      // First check token validity using our enhanced function
      const isTokenValid = await checkTokenValidity();
      if (!isTokenValid) {
        return;
      }
  
      // Use the API functions - they now handle token expiration internally
      const foldersResponse = await getWalletFolders();
      
      if (foldersResponse.success && foldersResponse.data) {
        const { folders, totalWallets } = foldersResponse.data;
        
        console.log('Wallet folders check:', {
          folderCount: folders.length,
          totalWallets: totalWallets
        });
  
        // If no folders exist, create a default one
        if (folders.length === 0) {
          console.log('No folders found, creating default folder...');
          const createFolderResponse = await createFolder('K33P Wallets');
          
          if (createFolderResponse.success && createFolderResponse.data) {
            console.log('Default folder created successfully:', createFolderResponse.data.id);
            // Store the default folder ID
            setDefaultFolderId(createFolderResponse.data.id);
            // Stay on current screen since folder is empty
            return;
          } else {
            console.log('Failed to create default folder');
            Alert.alert('Error', 'Failed to create wallet folder. Please try again.');
            return;
          }
        } else {
          // Store the first folder ID as default
          const firstFolder = folders[0];
          setDefaultFolderId(firstFolder.id);
          console.log('Default folder ID set:', firstFolder.id);
        }
  
        // Check if any folder has wallets
        const hasWallets = folders.some(folder => 
          folder.items && folder.items.length > 0
        );
  
        if (hasWallets) {
          console.log('Wallets found, redirecting to add-to-wallet screen');
          router.replace('/(home)/add-to-wallet');
        } else {
          console.log('No wallets found, staying on home screen');
          // Stay on current screen - folders exist but are empty
        }
      } else {
        console.log('Failed to fetch wallet folders:', foldersResponse.message);
        // Handle API errors appropriately
      }
    } catch (error: any) {
      console.log('Error checking wallet folders:', error);
      
      // Check if it's an authentication error
      if (error.message?.includes('Authentication required')) {
        // Token is invalid/expired, redirect to login
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please sign in again.',
          [{ text: 'OK', onPress: () => router.replace('/sign-in') }]
        );
        return;
      }
      
      // Handle other errors
      Alert.alert('Error', 'Failed to check wallet folders. Please try again.');
    } finally {
      setIsCheckingWallets(false);
    }
  }, [checkTokenValidity, router]);

  const openModal = useCallback(() => {
    if (!defaultFolderId) {
      Alert.alert('Error', 'Please wait while we set up your wallet folder...');
      return;
    }
    setModalVisible(true);
    setScanDeviceMessage(false); // Reset message when modal opens
  }, [defaultFolderId]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setScanDeviceMessage(false); // Reset message when modal closes
  }, []);

  const handleScanDevice = useCallback(() => {
    setScanDeviceMessage(true);
  }, []);

  const navigateToAddManually = useCallback(() => {
    closeModal();
    if (defaultFolderId) {
      router.push({
        pathname: '/add-manually',
        params: { folderId: defaultFolderId }
      });
    } else {
      Alert.alert('Error', 'Folder ID not available. Please try again.');
    }
  }, [defaultFolderId, router, closeModal]);

  const openCarouselModal = useCallback((item: Slide) => {
    setSelectedSlide(item);
    setCarouselModalVisible(true);
  }, []);

  const closeCarouselModal = useCallback(() => {
    setCarouselModalVisible(false);
    setSelectedSlide(null);
  }, []);

  useEffect(() => {
    const unsubscribePin = usePinStore.persist.onFinishHydration(() => {
      setIsStoreHydrated(true);
    });

    if (usePinStore.persist.hasHydrated()) {
      setIsStoreHydrated(true);
    }

    return () => {
      unsubscribePin();
    };
  }, []);

  // Initialize data when store is hydrated
  useEffect(() => {
    const initializeApp = async () => {
      if (!isStoreHydrated) {
        return;
      }

      // Check if user session is valid
      if (!phoneNumber) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please sign in again.',
          [{ text: 'OK', onPress: () => router.replace('/sign-in') }]
        );
        return;
      }

      if (hasPin && (pin === null || pin === undefined || pin === '')) {
        Alert.alert(
          'PIN Required',
          'Your PIN is missing or invalid. Please set your PIN again.',
          [{ text: 'OK', onPress: () => router.replace('/sign-in') }]
        );
        return;
      }

      // Fetch username first if needed, then check wallet folders
      await fetchUsernameFromAPI();
      await checkWalletFolders();
    };

    initializeApp();
  }, [isStoreHydrated, phoneNumber, pin, hasPin, router, checkWalletFolders]);

  // Refresh username when screen comes into focus
  useEffect(() => {
    if (isStoreHydrated) {
      fetchUsernameFromAPI();
    }
  }, [isStoreHydrated]);

  // Display name logic
  const displayName = username || 'User';

  // Show loading state while checking wallets
  if (isCheckingWallets) {
    return (
      <View className="flex-1 justify-center items-center bg-mainBlack">
        <Text className="text-white font-sora text-lg">Loading...</Text>
        <Text className="text-neutral200 font-space-mono text-sm mt-2">
          Checking your wallets...
        </Text>
        {isFetchingUsername && (
          <Text className="text-neutral200 text-sm mt-1 text-sora">Fetching user info...</Text>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 justify-between pt-6 pb-12 relative">
      {/* Header Icons */}
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

      {/* Main Content */}
      <View style={{ marginTop: 40 }}>
        <View className='px-6 mb-4'>
          <Text className='text-white font-sora mb-2'>Hello {displayName}!</Text>
          <Text className='text-[#B8B8B8] font-space-mono text-xs'>
            {getGreeting()}, and welcome to K33P.
          </Text>
        </View>

        {/* Carousel Component */}
        <Carousel onSlidePress={openCarouselModal} />
      </View>

      {/* Connect Section */}
      <View className="bg-[#222222] px-4 py-8 rounded-3xl space-y-4 mt-10 mx-3">
        <View className="items-center mb-4">
          <Text className="text-neutral200 font-sora-semibold text-sm">Connect</Text>
        </View>
        <Button 
          text="Add New Wallet" 
          onPress={openModal}
          loading={isCheckingWallets || !defaultFolderId}
          disabled={isCheckingWallets || !defaultFolderId}
        />
        {!defaultFolderId && (
          <Text className="text-neutral200 text-xs text-center mt-2">
            Setting up your wallet folder...
          </Text>
        )}
      </View>

      {/* Add Wallet Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Pressable onPress={closeModal} className="absolute inset-0 bg-black/60" />
        <View className="flex-1 justify-center items-center">
          <View className="bg-mainBlack rounded-3xl p-6 w-4/5">
            <Text className="text-white font-sora text-sm text-center mb-6">
              How do you want to add wallet
            </Text>
            <View className="space-y-4 gap-4">
              <Button
                text="Scan Device"
                onPress={handleScanDevice}
              />
              
              {/* Show message when Scan Device is clicked */}
             
              
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

      {/* Carousel Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={carouselModalVisible}
        onRequestClose={closeCarouselModal}
      >
        <Pressable 
          onPress={closeCarouselModal} 
          className="absolute inset-0 bg-black/80"
        />
        <View className="absolute bottom-0 w-full bg-mainBlack rounded-t-3xl" style={{ height: '70%' }}>
          {selectedSlide && (
            <>
              <Image
                source={selectedSlide.modalImage}
                className="w-full object-cover rounded-t-3xl"
              />
              <View className="px-4 py-6">
                <Text className="text-neutral100 font-space-mono text-sm mb-2">
                  {selectedSlide.label}
                </Text>
               
                <Text className="text-white font-sora text-sm">
                  {selectedSlide.description}
                </Text>
              </View>
              <View className="absolute bottom-16 left-0 right-0 px-4">
                <Button 
                  text="Close" 
                  onPress={closeCarouselModal}
                  outline
                />
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}