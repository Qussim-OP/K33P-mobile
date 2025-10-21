import { BackIcon } from '@/assets/images/svg';
import Button from '@/components/Button';
import { usePhoneStore } from '@/store/usePhoneStore';
import { usePinStore } from '@/store/usePinStore';
import { addWallets } from '@/utils/storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'; // Added Alert

const screenWidth = Dimensions.get('window').width;

interface Wallet {
  id: string;
  name: string;
  keyType?: '12' | '24';
  fileId?: string;
}

const foundWallets: Wallet[] = [ // Ensure foundWallets uses the Wallet interface
  { id: 'MetaMask', name: 'MetaMask' },
  { id: 'Trust Wallet', name: 'Trust Wallet' },
];

export default function SearchPage() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWallets, setSelectedWallets] = useState<Wallet[]>([]); // Store full Wallet objects
  const [isStoreHydrated, setIsStoreHydrated] = useState(false); // State for hydration

  const { phoneNumber } = usePhoneStore();
  const { pin, hasPin } = usePinStore();

  useEffect(() => {
    const unsubscribe = usePinStore.persist.onFinishHydration(() => {
      setIsStoreHydrated(true);
      console.log('SearchPage: Zustand Pin Store Hydrated!');
    });

    if (usePinStore.persist.hasHydrated()) {
      setIsStoreHydrated(true);
      console.log('SearchPage: Zustand Pin Store already hydrated on mount.');
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setModalVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleAddManually = () => {
    setModalVisible(false);
    router.push('/add-manually');
  };

  const handleProceed = async () => {
    if (selectedWallets.length === 0) {
      return;
    }

    if (!isStoreHydrated) {
      Alert.alert('Loading Session', 'Please wait while we load your session data.');
      return;
    }

    if (!phoneNumber) {
      Alert.alert(
        'Session Expired',
        'Your phone number is missing. Please log in again.',
        [{ text: 'OK', onPress: () => router.replace('/sign-in') }]
      );
      return;
    }

    let pinToUse: string;
    if (hasPin) {
      if (pin === null || pin === undefined) {
        Alert.alert(
          'PIN Required',
          'Your PIN is missing or invalid. Please set your PIN again.',
          [{ text: 'OK', onPress: () => router.replace('/sign-in/pinsetup') }]
        );
        return;
      }
      pinToUse = pin;
    } else {
      pinToUse = '';
    }

    try {
      await addWallets(selectedWallets, phoneNumber, pinToUse);
      setModalVisible(false);
      router.push('/(home)/add-to-wallet');
    } catch (error) {
      console.error('SearchPage: Error adding wallets:', error);
      Alert.alert('Error', 'Failed to add wallets. Please try again.');
    }
  };

  const handleWalletSelect = (wallet: Wallet) => {
    setSelectedWallets(prevSelected => {
      if (prevSelected.some(w => w.id === wallet.id)) {
        return prevSelected.filter(w => w.id !== wallet.id);
      } else {
        return [...prevSelected, wallet];
      }
    });
  };

  const isProceedButtonDisabled = selectedWallets.length === 0;

  return (
    <View className="flex-1 bg-[#181818]">
      <View className="absolute left-5 z-10">
      <TouchableOpacity onPress={() => router.back()}>
                <BackIcon width={40} height={40} />
              </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center px-8 z-10">
        <Text className="text-white font-sora text-sm text-center leading-relaxed px-8">
          K33P is scanning for active wallets on your device
        </Text>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: -200,
          width: screenWidth,
          zIndex: 1,
        }}
      >
        <Video
          source={require('../../../assets/animation/search-animate.mp4')}
          shouldPlay
          isLooping
          resizeMode="cover"
          style={{
            width: screenWidth,
            height: 550,
          }}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/70"
          onPress={() => setModalVisible(false)}
        >
          <View
            className="bg-mainBlack rounded-t-3xl pt-4 px-6"
            style={{ height: '70%' }}
            onStartShouldSetResponder={() => true}
          >
            <View className="w-16 h-1 bg-white rounded-full self-center mb-4" />

            <Text className="text-white font-sora-bold text-sm text-center mb-6 px-8">
              Choose from your list of active wallet to store Key Phrase
            </Text>

            <ScrollView className="flex-1">
              {foundWallets.map(wallet => (
                <TouchableOpacity
                  key={wallet.id}
                  className="flex-row items-center gap-3 py-3"
                  onPress={() => handleWalletSelect(wallet)} // Pass the full wallet object
                >
                  {selectedWallets.some(w => w.id === wallet.id) ? ( // Check using wallet.id
                    <MaterialIcons name="radio-button-checked" size={20} color="#FFD700" />
                  ) : (
                    <MaterialIcons name="radio-button-unchecked" size={20} color="#B0B0B0" />
                  )}
                  <Text className="text-white font-sora text-base">{wallet.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View className="pb-8 pt-4 gap-y-5">
              <Button text="Add Manually" onPress={handleAddManually} outline />
              <Button text="Proceed" onPress={handleProceed} isDisabled={isProceedButtonDisabled} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}