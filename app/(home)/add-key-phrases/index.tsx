import { BackIcon } from '@/assets/images/svg';
import Button from '@/components/Button';
import { usePhoneStore } from '@/store/usePhoneStore';
import { useVaultStore } from '@/store/useVaultStore';
import { encryptPhrases } from '@/utils/crypto';
import { addWalletRecoveryData } from '@/utils/wallet-api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import ArrowLeft from '../../../assets/images/left.png';
import ArrowRight from '../../../assets/images/right.png';

export default function AddKey() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedKeyType, setSelectedKeyType] = useState<'12' | '24'>('12');
  const [phrases, setPhrases] = useState<string[]>(Array(24).fill(''));
  const [focusedInput, setFocusedInput] = useState<number | null>(null);
  const [page, setPage] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const mainScrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { phoneNumber } = usePhoneStore();
  const { setFileId } = useVaultStore();
  const inputRefs = useRef<(View | null)[]>(Array(24).fill(null));
  const scrollPositionRef = useRef(0);
  const screenHeightRef = useRef(0);

  // Get the wallet and folder IDs from params
  const walletId = params.walletId as string;
  const walletFolderId = params.walletFolderId as string;
  const walletName = params.walletName as string;

  const totalPages = selectedKeyType === '12' ? 1 : 2;
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  useEffect(() => {
    if (!phoneNumber) {
      Alert.alert('Session Expired', 'Your session has expired or phone number is missing. Please sign in again.', [
        { text: 'OK', onPress: () => router.replace('/sign-in') }
      ]);
    }
  }, [phoneNumber, router]);

  const keyboardHeightRef = useRef(0);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      keyboardHeightRef.current = e.endCoordinates.height;
      setKeyboardVisible(true);
    });
  
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeightRef.current = 0;
      setKeyboardVisible(false);
  
      requestAnimationFrame(() => {
        mainScrollViewRef.current?.scrollTo({
          y: scrollPositionRef.current,
          animated: true
        });
      });
    });
  
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  
  

  // Track scroll position when keyboard is not visible
  const handleScroll = useCallback((event: any) => {
    if (!keyboardVisible) {
      scrollPositionRef.current = event.nativeEvent.contentOffset.y;
    }
  }, [keyboardVisible]);
  const [inputPositions, setInputPositions] = useState<number[]>(Array(24).fill(0));
  const handlePhraseChange = (text: string, index: number) => {
    if (index === 0 && text.includes(' ')) {
      const splitPhrases = text.trim().split(/\s+/);
      const limit = selectedKeyType === '12' ? 12 : 24;
      const newPhrases = [...phrases];
      splitPhrases.slice(0, limit).forEach((word, i) => {
        newPhrases[i] = word;
      });
      setPhrases(newPhrases);
    } else {
      const newPhrases = [...phrases];
      newPhrases[index] = text;
      setPhrases(newPhrases);
    }
  };

  const handleFocus = (index: number) => {
    setFocusedInput(index);
  
    requestAnimationFrame(() => {
      const input = inputRefs.current[index];
      const scrollView = mainScrollViewRef.current;
  
      if (!input || !scrollView) return;
  
      input.measureLayout(
        scrollView,
        (_x, y) => {
          const keyboardHeight = keyboardHeightRef.current;
          const screenHeight = screenHeightRef.current;
  
          const visibleHeight = screenHeight - keyboardHeight;
          const bufferBelow = 160;
  
          const targetY = y - (visibleHeight - bufferBelow);
  
          scrollView.scrollTo({
            y: Math.max(0, targetY),
            animated: true
          });
        },
        () => {
          console.log('measureLayout failed');
        }
      );
    });
  };
  
  

  const renderPhraseInputs = (start: number, end: number) => {
    const inputs = [];
    for (let i = start; i < end; i += 2) {
      inputs.push(
        <View key={`row-${i}`} className="flex-row justify-center mb-6">
          {[i, i + 1].map(index => (
            <View
            ref={el => (inputRefs.current[index] = el)}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setInputPositions(prev => {
                if (prev[index] === layout.y) return prev;
                const next = [...prev];
                next[index] = layout.y;
                return next;
              });
              
            }}
              key={`input-wrapper-${index}`}
              className="w-[45%] mx-2"
            >
              <TextInput
                className={`h-14 rounded-lg p-4 text-center font-sora ${
                  focusedInput === index || phrases[index]
                    ? 'bg-white text-black'
                    : 'bg-neutral300 text-neutral50'
                }`}
                placeholder={`Phrase ${index + 1}`}
                placeholderTextColor="#B0B0B0"
                value={phrases[index]}
                onChangeText={text => handlePhraseChange(text, index)}
                onFocus={() => handleFocus(index)}
                onBlur={() => setFocusedInput(null)}
                keyboardAppearance="dark"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}
        </View>
      );
    }
    return inputs;
  };

  const goToPrevPage = useCallback(() => {
    setPage(prev => {
      if (prev <= 1) return prev;
      mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
      scrollPositionRef.current = 0;
      return (prev - 1) as 1 | 2;
    });
  }, []);

  const goToNextPage = useCallback(() => {
    setPage(prev => {
      if (prev >= totalPages) return prev;
      mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
      scrollPositionRef.current = 0;
      return (prev + 1) as 1 | 2;
    });
  }, [totalPages]);

  const getStartEndIndex = () => {
    if (selectedKeyType === '12') return [0, 12];
    return page === 1 ? [0, 12] : [12, 24];
  };

  const [start, end] = getStartEndIndex();

  const allPhrasesFilled =
    selectedKeyType === '12'
      ? phrases.slice(0, 12).every(p => p.trim() !== '')
      : phrases.slice(0, 24).every(p => p.trim() !== '');

  const handleSaveKeyPhrases = async () => {
    try {
      setIsLoading(true);
      
      if (!phoneNumber) {
        Alert.alert('Error', 'Phone number is missing. Please sign in again.');
        router.replace('/sign-in');
        return;
      }

      if (!walletId || !walletFolderId) {
        Alert.alert('Error', 'Wallet information is missing. Please try again.');
        return;
      }

      console.log('Saving key phrases for wallet:', {
        walletId,
        walletFolderId,
        walletName,
        keyType: selectedKeyType
      });

      const phrasesToProcess = selectedKeyType === '12' ? phrases.slice(0, 12) : phrases.slice(0, 24);
      const SEPARATOR = '|||';
      const phrasesString = phrasesToProcess.join(SEPARATOR);
      const encryptedPhrases = await encryptPhrases(phrasesString, phoneNumber);
      const metaString = `${selectedKeyType}${walletName}`;
      const encryptedMeta = await encryptPhrases(metaString, phoneNumber);
      const finalEncrypted = `${encryptedPhrases}${SEPARATOR}${encryptedMeta}`;

      console.log('Saving encrypted phrases to vault...');
      const response = await fetch('https://k33p-k33p-reir.onrender.com/api/v1/vault/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encrypted_seed_phrase: finalEncrypted })
      });

      if (!response.ok) {
        throw new Error(`Failed to save to vault: ${response.status}`);
      }

      const result = await response.json();
      const fileId = result?.data?.file_id;

      if (!fileId) {
        throw new Error('No file ID received from server');
      }

      console.log('Successfully saved to vault, fileId:', fileId);
      setFileId(fileId);

      console.log('Updating wallet with recovery data...');
      const updateResponse = await addWalletRecoveryData(
        walletFolderId,
        walletId,
        {
          keyType: selectedKeyType,
          fileId: fileId
        }
      );

      if (updateResponse.success) {
        console.log('Wallet successfully updated with recovery data');
        
        router.push({
          pathname: '/(home)/add-to-wallet',
          params: {
            updatedWallet: JSON.stringify({
              id: walletId,
              name: walletName,
              keyType: selectedKeyType,
              fileId: fileId,
              folderId: walletFolderId
            })
          }
        });
      } else {
        throw new Error(updateResponse.message || 'Failed to update wallet with recovery data');
      }

    } catch (err: any) {
      console.error('Error saving key phrases:', err);
      Alert.alert(
        'Error', 
        err.message || 'Failed to save wallet. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 mb">
        <ScrollView
          ref={mainScrollViewRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            flexGrow: 1, 
            paddingBottom: keyboardVisible ? 400 : 5
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          style={{ flex: 1 }}
        >
          <View className="flex-1 px-5 min-h-full" onLayout={(e) => {
            screenHeightRef.current = e.nativeEvent.layout.height;
          }}>
            <View className="relative flex-row items-center justify-start mb-6 mt-4">
              <TouchableOpacity className="z-10" onPress={() => router.back()}>
                <BackIcon width={40} height={40} />
              </TouchableOpacity>
            </View>


            <View className="flex-row mb-2 mt-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${selectedKeyType === '12' ? 'bg-white' : ''}`}
                onPress={() => {
                  setSelectedKeyType('12');
                  setPage(1);
                  scrollPositionRef.current = 0;
                  mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <Text
                  className={`text-center font-sora ${
                    selectedKeyType === '12' ? 'text-black font-sora-semibold' : 'text-neutral200'
                  }`}
                >
                  12 Keys
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${selectedKeyType === '24' ? 'bg-white' : ''}`}
                onPress={() => {
                  setSelectedKeyType('24');
                  setPage(1);
                  scrollPositionRef.current = 0;
                  mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <Text
                  className={`text-center font-sora ${
                    selectedKeyType === '24' ? 'text-black font-sora-semibold' : 'text-neutral200'
                  }`}
                >
                  24 Keys
                </Text>
              </TouchableOpacity>
            </View>

            <View className="my-5 bg-white/10 rounded-xl pt-4">
              {renderPhraseInputs(start, end)}
            </View>
            
            {selectedKeyType === '24' && (
              <View className="flex-row items-center justify-between mt-2 px-4 mb-4">
                <TouchableOpacity onPress={goToPrevPage} disabled={isFirstPage}>
                  <Image source={ArrowLeft} style={{ opacity: isFirstPage ? 0.5 : 1 }} />
                </TouchableOpacity>

                <View className="flex-row gap-3 items-center">
                  {[...Array(totalPages)].map((_, index) => (
                    <View
                      key={index}
                      className={`rounded-full ${
                        page === index + 1 ? 'bg-white w-4 h-2' : 'bg-neutral100 w-2 h-2'
                      }`}
                    />
                  ))}
                </View>

                <TouchableOpacity onPress={goToNextPage} disabled={isLastPage}>
                  <Image source={ArrowRight} style={{ opacity: isLastPage ? 0.5 : 1 }} />
                </TouchableOpacity>
              </View>
            )}
            
            <View className="pb-20 pt-4">
              <Button
                text="Done"
                onPress={handleSaveKeyPhrases}
                isLoading={isLoading}
                isDisabled={!allPhrasesFilled}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}