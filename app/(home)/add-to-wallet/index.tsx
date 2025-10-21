import { FOLDER, INFO, PROFILE } from '@/assets/images/svg';
import Button from '@/components/Button';
import { usePhoneStore } from '@/store/usePhoneStore';
import { usePinStore } from '@/store/usePinStore';
import { getStoredWallets, addWallets as storageAddWallets, storeWallets } from '@/utils/storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
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
}

export default function Index() {
  const [addWalletModalVisible, setAddWalletModalVisible] = useState(false);
  const [walletActionModalVisible, setWalletActionModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  const params = useLocalSearchParams();
  const router = useRouter();
  const { phoneNumber } = usePhoneStore();
  const { pin, hasPin } = usePinStore();

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

  // Effect to navigate home if no wallets exist
  useEffect(() => {
    if (isStoreHydrated && wallets.length === 0 && phoneNumber) {
      const timer = setTimeout(() => {
        router.replace('/(home)');
      }, 1500); // Small delay to show the empty state briefly

      return () => clearTimeout(timer);
    }
  }, [wallets.length, isStoreHydrated, phoneNumber, router]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (isStoreHydrated && phoneNumber && (pin !== null || !hasPin)) {
          console.log('WalletFolders - useFocusEffect: Loading wallets from storage...');
          const savedWallets = await getStoredWallets(phoneNumber, pin || '');
          console.log('WalletFolders - Wallets loaded from storage:', savedWallets);
          setWallets(savedWallets);
        } else if (isStoreHydrated && (!phoneNumber || (hasPin && pin === null))) {
          setWallets([]);
          console.log('WalletFolders - Cleared wallets due to missing credentials after hydration.');
        } else {
          console.log('WalletFolders - Waiting for stores to hydrate or credentials to become available...');
        }
      };
      loadData();

      return () => {};
    }, [phoneNumber, pin, hasPin, isStoreHydrated])
  );

  useEffect(() => {
    if (!isStoreHydrated || !phoneNumber) return;

    if (params.updatedWallet) {
      try {
        const updatedWallet = JSON.parse(params.updatedWallet as string) as Wallet;
        console.log('WalletFolders - Processing updatedWallet param:', updatedWallet);

        const updateAndSave = async () => {
          if (phoneNumber && (pin !== null || !hasPin)) {
            const currentWallets = await getStoredWallets(phoneNumber, pin || '');
            const newWallets = currentWallets.map((wallet) =>
              wallet.id === updatedWallet.id
                ? { ...wallet, keyType: updatedWallet.keyType, fileId: updatedWallet.fileId }
                : wallet
            );
            await storeWallets(newWallets, phoneNumber, pin || '');
            console.log('WalletFolders - Wallet updated and saved to storage. Triggering re-render.');
            setWallets(newWallets);
          }
        };
        updateAndSave();
      } catch (e) {
        console.error('WalletFolders - Error parsing updated wallet from params:', e);
      }
    }
  }, [params.updatedWallet, phoneNumber, pin, hasPin, isStoreHydrated]);

  useEffect(() => {
    if (!isStoreHydrated || !phoneNumber) return;

    if (params.newWallets) {
      try {
        const newlyAddedWallets: Wallet[] = JSON.parse(params.newWallets as string);
        console.log('WalletFolders - Processing newWallets param:', newlyAddedWallets);

        const addAndSave = async () => {
          if (phoneNumber && (pin !== null || !hasPin)) {
            const updatedWallets = await storageAddWallets(newlyAddedWallets, phoneNumber, pin || '');
            console.log('WalletFolders - New wallets added and saved to storage. Triggering re-render.');
            setWallets(updatedWallets);
          }
        };
        addAndSave();
      } catch (e) {
        console.error('WalletFolders - Error parsing new wallets from params:', e);
      }
    }
  }, [params.newWallets, phoneNumber, pin, hasPin, isStoreHydrated]);

  const openAddWalletModal = () => setAddWalletModalVisible(true);
  const closeAddWalletModal = () => setAddWalletModalVisible(false);

  const openWalletActionModal = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setWalletActionModalVisible(true);
  };

  const closeWalletActionModal = () => {
    setSelectedWallet(null);
    setWalletActionModalVisible(false);
  };

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
                  Alert.alert('Success', 'Key phrases deleted from backend.');
                } else {
                  console.error('WalletFolders - Failed to delete file from backend:', responseData.message || 'Unknown error');
                  Alert.alert('Error', `Failed to delete key phrases from backend: ${responseData.message || 'Please try again.'}`);
                }
              } catch (error) {
                console.error('WalletFolders - Network or API error during file deletion:', error);
                Alert.alert('Error', 'Network error or server unreachable during key phrase deletion. Please check your connection.');
              }
            } else {
              console.log('WalletFolders - No fileId found for wallet, skipping backend deletion.');
            }

            if (phoneNumber && (pin !== null || !hasPin)) {
                const updatedWallets = wallets.filter(w => w.id !== selectedWallet.id);
                setWallets(updatedWallets);
                await storeWallets(updatedWallets, phoneNumber, pin || '');
                console.log('WalletFolders - Wallets after local removal and save:', updatedWallets);
            } else {
                console.warn('Phone number or PIN missing, cannot update stored wallets.');
            }
            closeWalletActionModal();
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

  if (!isStoreHydrated) {
    return (
      <View className="flex-1 bg-neutral800 justify-center items-center">
        <Text className="text-white text-lg">Loading your session...</Text>
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
          <Text className='text-white font-sora mb-2'>Hello Kara</Text>
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
                {row.map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    onPress={() => openWalletActionModal(wallet)}
                    className="items-center w-1/2 px-2"
                  >
                    <View className="items-center">
                    <FOLDER />
                      <Text className="text-white font-sora text-base text-center mb-1 mt-5">
                        {wallet.keyType ? `${wallet.keyType} Keys` : 'Add Key Phrases'}
                      </Text>
                      <Text className="text-neutral100 font-sora text-sm text-center">
                        {wallet.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
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
                onPress={() => {
                  closeAddWalletModal();
                  router.push('/search');
                }}
              />
              <Button
                text="Add Manually"
                onPress={() => {
                  closeAddWalletModal();
                  router.push({
                    pathname: '/add-manually',
                  });
                }}
                outline
              />
            </View>
          </View>
        </View>
      </Modal>

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
            </View>
          </View>
        </View>
      </Modal>

      <View className="bg-[#222222] px-4 pt-8 pb-8 mb-16 rounded-3xl mt-10">
        <View className="items-center mb-4">
          <Text className="text-neutral200 font-sora-semibold text-sm">Connect</Text>
        </View>
        <Button
          text={wallets.length > 0 ? "Add Another Wallet" : "Add New Wallet"}
          onPress={openAddWalletModal}
        />
      </View>
    </View>
  );
}