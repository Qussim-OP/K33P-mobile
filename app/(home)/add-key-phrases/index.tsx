import { BackIcon } from '@/assets/images/svg';
import Button from '@/components/Button';
import { usePhoneStore } from '@/store/usePhoneStore';
import { useVaultStore } from '@/store/useVaultStore';
import { encryptPhrases } from '@/utils/crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
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
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { phoneNumber } = usePhoneStore();
  const { setFileId } = useVaultStore();

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

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
    if (index >= 6) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 200, animated: true });
      }, 300);
    }
  };

  const renderPhraseInputs = (start: number, end: number) => {
    const inputs = [];
    for (let i = start; i < end; i += 2) {
      inputs.push(
        <View key={`row-${i}`} className="flex-row justify-center mb-6">
          {[i, i + 1].map(index => (
            <TextInput
              key={`phrase-${index}`}
              className={`w-[45%] h-14 rounded-lg p-4 mx-2 text-center font-sora ${
                focusedInput === index || phrases[index] ? 'bg-white text-black' : 'bg-neutral300 text-neutral50'
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
          ))}
        </View>
      );
    }
    return inputs;
  };

  const goToPrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const goToNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const getStartEndIndex = () => {
    if (selectedKeyType === '12') return [0, 12];
    return page === 1 ? [0, 12] : [12, 24];
  };

  const [start, end] = getStartEndIndex();

  const allPhrasesFilled =
    selectedKeyType === '12'
      ? phrases.slice(0, 12).every(p => p.trim() !== '')
      : phrases.slice(0, 24).every(p => p.trim() !== '');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 px-5">
        <View className="relative flex-row items-center justify-start mb-6">
          <TouchableOpacity className="z-10" onPress={() => router.back()}>
            <BackIcon width={40} height={40} />
          </TouchableOpacity>
        </View>

        <View className="flex-row mb-8 mt-3">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-xl ${selectedKeyType === '12' ? 'bg-white' : ''}`}
            onPress={() => {
              setSelectedKeyType('12');
              setPage(1);
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

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView
            ref={scrollViewRef}
            className="my-5"
            contentContainerStyle={{
              paddingBottom: keyboardHeight ? keyboardHeight + 20 : 20
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="bg-white/10 rounded-xl pt-4">{renderPhraseInputs(start, end)}</View>

            {selectedKeyType === '24' && (
              <View className="flex-row items-center justify-between mt-10 px-4">
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
          </ScrollView>
        </KeyboardAvoidingView>

        <View className="pb-16">
          <Button
            text="Done"
            onPress={async () => {
              try {
                setIsLoading(true);
                if (!phoneNumber) {
                  Alert.alert('Error', 'Phone number is missing. Please sign in again.');
                  router.replace('/sign-in');
                  return;
                }
                const phrasesToProcess = selectedKeyType === '12' ? phrases.slice(0, 12) : phrases.slice(0, 24);
                const SEPARATOR = '|||';
                const phrasesString = phrasesToProcess.join(SEPARATOR);
                const encryptedPhrases = await encryptPhrases(phrasesString, phoneNumber);
                const metaString = `${selectedKeyType}${params.walletName}`;
                const encryptedMeta = await encryptPhrases(metaString, phoneNumber);
                const finalEncrypted = `${encryptedPhrases}${SEPARATOR}${encryptedMeta}`;
                const response = await fetch('https://k33p-k33p-reir.onrender.com/api/v1/vault/store', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ encrypted_seed_phrase: finalEncrypted })
                });
                if (!response.ok) throw new Error(`Failed to save to vault: ${response.status}`);
                const result = await response.json();
                const fileId = result?.data?.file_id;
                if (!fileId) throw new Error('No file ID received from server');
                setFileId(fileId);
                router.push({
                  pathname: '/(home)/add-to-wallet',
                  params: {
                    updatedWallet: JSON.stringify({
                      id: params.walletId,
                      name: params.walletName,
                      keyType: selectedKeyType,
                      fileId
                    })
                  }
                });
              } catch (err) {
                console.error('Error:', err);
                Alert.alert('Error', 'Failed to save wallet. Please try again.');
              } finally {
                setIsLoading(false);
              }
            }}
            isLoading={isLoading}
            isDisabled={!allPhrasesFilled}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
