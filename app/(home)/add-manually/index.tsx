import { BackIcon } from '@/assets/images/svg';
import Button from '@/components/Button';
import { addWalletToFolder, createWalletData } from '@/utils/wallet-api';
import { Octicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

interface Wallet {
  id: string;
  name: string;
  keyType?: '12' | '24';
  fileId?: string;
}

const allWallets: Wallet[] = [
  { id: '1', name: 'Phantom Wallet' },
  { id: '2', name: 'Trust Wallet' },
  { id: '3', name: 'Danmask' },
  { id: '4', name: 'Quantum' },
  { id: '5', name: 'CoinKeeper' },
  { id: '6', name: 'X Wallet' },
  { id: '7', name: 'Telegram' },
  { id: '8', name: 'MetaMask' },
  { id: '9', name: 'Coinbase Wallet' },
  { id: '10', name: 'Ledger Live' },
  { id: '11', name: 'Trezor Suite' },
  { id: '12', name: 'Exodus' },
  { id: '13', name: 'Atomic Wallet' },
  { id: '14', name: 'MyEtherWallet (MEW)' },
  { id: '15', name: 'Crypto.com Defi Wallet' },
];

const popularWallets: Wallet[] = [
  { id: '1', name: 'Phantom Wallet' },
  { id: '2', name: 'Trust Wallet' },
  { id: '3', name: 'Danmask' },
  { id: '4', name: 'Quantum' },
  { id: '5', name: 'CoinKeeper' },
  { id: '6', name: 'X Wallet' },
  { id: '7', name: 'Telegram' },
];

export default function AddManually() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams();
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWallets, setSelectedWallets] = useState<Wallet[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const textInputRef = useRef<TextInput>(null);

  // Log folder ID when component mounts
  useEffect(() => {
    console.log('AddManually: Folder ID received:', folderId);
    
    if (!folderId) {
      Alert.alert('Error', 'Folder ID not found. Please go back and try again.');
    }
  }, [folderId]);

  // Keyboard listeners
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const filteredWallets = allWallets.filter(wallet =>
    wallet.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSearch = () => {
    isSearching ? collapseSearch() : expandSearch();
  };

  const expandSearch = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSearching(true);
      textInputRef.current?.focus();
    });
  };

  const collapseSearch = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSearching(false);
      setSearchQuery('');
    });
  };

  const handleOutsidePress = () => {
    Keyboard.dismiss();
  };

  const handleProceed = async () => {
    if (!folderId) {
      Alert.alert('Error', 'Folder ID not found. Please try again.');
      return;
    }

    if (selectedWallets.length === 0) {
      Alert.alert('No Wallets Selected', 'Please select at least one wallet to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Add each selected wallet to the folder with just the name
      const results = await Promise.allSettled(
        selectedWallets.map(async (wallet) => {
          // Create wallet data with just the name (no keyType or fileId)
          const walletData = createWalletData(wallet.name);

          console.log(`Adding wallet to folder ${folderId}:`, walletData);
          
          const result = await addWalletToFolder(folderId as string, walletData);
          
          if (!result.success) {
            throw new Error(result.message || `Failed to add ${wallet.name}`);
          }
          
          return result;
        })
      );

      // Check results
      const successfulWallets = results.filter(result => result.status === 'fulfilled').length;
      const failedWallets = results.filter(result => result.status === 'rejected');

      if (failedWallets.length === 0) {
        // All wallets added successfully
        Alert.alert(
          'Success', 
          `${successfulWallets} wallet(s) added successfully!`,
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/(home)/add-to-wallet')
            }
          ]
        );
      } else {
        // Some wallets failed
        const errorMessages = failedWallets
          .map((result: any) => result.reason?.message || 'Unknown error')
          .join('\n• ');

        Alert.alert(
          'Errror',
          `${errorMessages}`,
          [{ text: 'OK' }]
        );
      }

    } catch (error: any) {
      console.error('AddManually: Error adding wallets to folder:', error);
      Alert.alert('Error', 'Failed to add wallets. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    
    // If not searching, trigger search mode when a wallet is selected
    if (!isSearching) expandSearch();
  };

  const removeSelectedWallet = (walletId: string) => {
    setSelectedWallets(selectedWallets.filter(w => w.id !== walletId));
  };

  const searchOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const searchBarOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const searchBarTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View className="flex-1 px-5">
          {/* Header Area (Back button and Animated Search Input) */}
          <View className="">
            <View className="flex-row items-center justify-start mb-4">
              <TouchableOpacity onPress={() => router.back()}>
                <BackIcon width={40} height={40} />
              </TouchableOpacity>
            </View>

            <Animated.View
              style={{
                opacity: searchBarOpacity,
                transform: [{ translateY: searchBarTranslateY }],
              }}
              className="bg-searchBg rounded-xl h-12 flex-row items-center px-4 mb-6"
            >
              <Octicons name="search" size={16} color="#B8B8B8" />
              <TextInput
                ref={textInputRef}
                className="flex-1 text-white ml-2 font-sora text-sm"
                placeholder="Search wallets..."
                placeholderTextColor="#B0B0B0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={expandSearch}
              />
            </Animated.View>
          </View>

          {/* Folder Info */}
          {/* {folderId && (
            <View className="bg-primary20 rounded-lg p-3 mb-4">
              <Text className="text-primary100 font-sora text-xs">
                Adding wallets to your folder
              </Text>
            </View>
          )} */}

          {/* Main Content Area */}
          <View className={`flex-1 ${!isSearching ? 'justify-end' : ''}`}>
            {/* Selected Wallets - Visible only when searching and if any wallets are selected */}
            {isSearching && selectedWallets.length > 0 && (
              <View className="flex-row flex-wrap mb-3">
                {selectedWallets.map(wallet => (
                  <View key={wallet.id} className="bg-primary100 flex-row items-center rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-black font-sora text-xs mr-2">{wallet.name}</Text>
                    <TouchableOpacity onPress={() => removeSelectedWallet(wallet.id)}>
                      <Octicons name="x" size={12} color="black" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {isSearching ? (
              <>
                <ScrollView
                  className="flex-1"
                  keyboardShouldPersistTaps="handled"
                >
                  {searchQuery !== '' ? (
                    // Display filtered wallets ONLY when a search query is present
                    filteredWallets.map(wallet => (
                      <TouchableOpacity
                        key={wallet.id}
                        className="flex-row justify-between items-center py-3"
                        onPress={() => handleWalletSelect(wallet)}
                      >
                        <Text className="text-white font-sora text-base">{wallet.name}</Text>
                        {selectedWallets.some(w => w.id === wallet.id) ? (
                          <MaterialIcons name="radio-button-checked" size={20} color="#FFD700" />
                        ) : (
                          <MaterialIcons name="radio-button-unchecked" size={20} color="#B0B0B0" />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    // If searching but query is empty, show Popular Searches (only if no selected items)
                    selectedWallets.length === 0 && (
                      <View className="pb-4">
                        <Text className="text-neutral100 font-space-mono text-xs mb-4">Popular Searches</Text>
                        <View className="flex-row flex-wrap">
                          {popularWallets.map(wallet => (
                            <TouchableOpacity
                              key={wallet.id}
                              className="bg-neutral300 rounded-lg px-4 py-3 mr-2 mb-3"
                              onPress={() => handleWalletSelect(wallet)}
                            >
                              <Text className="text-white font-sora text-sm">{wallet.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )
                  )}
                </ScrollView>
              </>
            ) : (
              // Display initial content (question and popular searches) when not searching
              <>
                {selectedWallets.length === 0 && ( // Only show question if no selected wallets
                  <View className="flex-row justify-between items-start mb-8">
                    <Animated.Text
                      style={{ opacity: searchOpacity, flex: 1 }}
                      className="text-white font-sora-bold text-base"
                    >
                      What wallet would you like to add?
                    </Animated.Text>
                    <Animated.View style={{ opacity: searchOpacity }}>
                      <TouchableOpacity
                        onPress={toggleSearch}
                        className="bg-mainBlack p-3 rounded-full ml-4"
                      >
                        <Octicons name="search" size={18} color="#FFD700" />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                )}

                {selectedWallets.length === 0 && ( // Only show popular searches if no selected wallets
                  <View className="pb-4">
                    <Text className="text-neutral100 font-space-mono text-xs mb-4">Popular Searches</Text>
                    <View className="flex-row flex-wrap">
                      {popularWallets.map(wallet => (
                        <TouchableOpacity
                          key={wallet.id}
                          className="bg-neutral300 rounded-lg px-4 py-3 mr-2 mb-3"
                          onPress={() => handleWalletSelect(wallet)}
                        >
                          <Text className="text-white font-sora text-sm">{wallet.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Proceed Button - Updated with loading state */}
          {(selectedWallets.length > 0 || (isSearching && searchQuery !== '')) && (
            <View className="pb-16">
              <Button
                text={isSubmitting ? "Adding Wallets..." : `Add ${selectedWallets.length} Wallet(s)`}
                onPress={handleProceed}
                isDisabled={selectedWallets.length === 0 || isSubmitting}
                loading={isSubmitting}
              />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}