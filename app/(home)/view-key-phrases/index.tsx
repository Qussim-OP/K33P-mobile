import { usePhoneStore } from '@/store/usePhoneStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { decryptPhrases } from '@/utils/crypto';
import CopyIcon from '../../../assets/images/Copy.png';
import EyeClosedIcon from '../../../assets/images/eye-closed.png';
import EyeIcon from '../../../assets/images/eye.png';
import ArrowLeft from '../../../assets/images/left.png';
import ArrowRight from '../../../assets/images/right.png';
import { BackIcon } from '@/assets/images/svg';



interface VaultRetrieveResponse {
  status: string;
  message: string;
  data: {
    encrypted_seed_phrase: string;
  };
}

export default function ViewKey() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { phoneNumber } = usePhoneStore();

  const [phrases, setPhrases] = useState<string[]>([]);
  const [page, setPage] = useState<1 | 2>(1);
  const [keyCount, setKeyCount] = useState<string>('');
  const [displayedKeyType, setDisplayedKeyType] = useState<'12' | '24'>('12');
  const [walletName, setWalletName] = useState<string>('Wallet');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConcealed, setIsConcealed] = useState<boolean>(true);
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);


  const totalPages = keyCount === '12' ? 1 : 2;
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  useEffect(() => {
    const fileId = params?.fileId as string;

    if (!fileId) {
      setError('File ID not provided in navigation parameters.');
      setLoading(false);
      return;
    }

    if (!phoneNumber) {
      setError('Phone number not available for decryption. Please log in.');
      setLoading(false);
      Alert.alert(
        "Session Expired",
        "Your session has expired or phone number is missing. Please sign in again.",
        [{ text: "OK", onPress: () => router.replace('/sign-in') }]
      );
      return;
    }

    const retrieveAndDecrypt = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://k33p-k33p-reir.onrender.com/api/v1/vault/retrive', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file_id: fileId }),
        });

        const data: VaultRetrieveResponse = await response.json();

        if (response.ok && data.status === 'success') {
          const encryptedSeedPhrase = data.data.encrypted_seed_phrase;

          const SEPARATOR = '|||';
          const [encryptedPhrasesPart, encryptedMetaPart] = encryptedSeedPhrase.split(SEPARATOR);

          if (!encryptedPhrasesPart || !encryptedMetaPart) {
            throw new Error("Invalid encrypted payload format. Missing separator.");
          }

          const decryptedPhrasesString = await decryptPhrases(encryptedPhrasesPart, phoneNumber);
          const phrasesArray = decryptedPhrasesString.split(SEPARATOR);

          const decryptedMetaString = await decryptPhrases(encryptedMetaPart, phoneNumber);
          const extractedKeyCount = decryptedMetaString.slice(0, 2);
          const extractedWalletName = decryptedMetaString.slice(2);

          setKeyCount(extractedKeyCount);
          setDisplayedKeyType(extractedKeyCount as '12' | '24');
          setWalletName(extractedWalletName);
          setPhrases(phrasesArray);
          console.log('Successfully retrieved and decrypted phrases.');
        } else {
          throw new Error(data.message || `API error: ${response.status}`);
        }
      } catch (err) {
        console.error('Error in retrieveAndDecrypt:', err);
        setError(`Failed to load key phrases: ${err instanceof Error ? err.message : String(err)}`);
        Alert.alert("Error", `Failed to load key phrases. Please ensure the wallet is properly synced and try again.`);
      } finally {
        setLoading(false);
      }
    };

    retrieveAndDecrypt();
  }, [params.fileId, phoneNumber, router]);

  const handleKeyTypeSwitch = (type: '12' | '24') => {
    if (type === '12' || (type === '24' && keyCount === '24')) {
      setDisplayedKeyType(type);
      setPage(1);
    } else {
      Alert.alert("Info", `This wallet has only ${keyCount} keys.`);
    }
  };

  const getStartEndIndex = () => {
    const currentViewKeyType = displayedKeyType;

    if (currentViewKeyType === '12' || keyCount === '12') {
      return [0, 12];
    } else {
      return page === 1 ? [0, 12] : [12, 24];
    }
  };

  const [start, end] = getStartEndIndex();

  const renderPhraseBoxes = (startIndex: number, endIndex: number) => {
    const boxes = [];
    for (let i = startIndex; i < endIndex; i += 2) {
      boxes.push(
        <View key={`row-${i}`} className="flex-row justify-center mb-6 ">
          {[i, i + 1].map((index) => (
            <View
              key={`phrase-${index}`}
              className="w-[45%] h-14 rounded-xl mx-2 justify-center items-center overflow-hidden border border-white/20 bg-white"
              style={
                isConcealed
                  ? {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(200px)',
                      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                    }
                  : {
                      
                    }
              }
            >
              <Text
                className={`text-black font-sora text-base ${
                  isConcealed ? 'opacity-5' : ''
                }`}
              >
                {phrases[index]}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    return boxes;
  };
  
  const handleCopyPhrases = () => {
    const [startIndex, endIndex] = getStartEndIndex();
    const phrasesToCopy = phrases.slice(startIndex, endIndex).join(' ');
    Clipboard.setString(phrasesToCopy);
    setCopiedFeedback(true);
    setTimeout(() => {
      setCopiedFeedback(false);
    }, 2000);
  };


  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FFD700" />
        <Text className="text-white mt-4">Loading key phrases...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-5">
        <Text className="text-red-500 text-center text-lg">{error}</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} className="mt-8 bg-blue-500 p-3 rounded-lg">
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 px-5">
      <View className="relative flex-row items-center justify-start mb-6">
        <TouchableOpacity className="z-10" onPress={() => router.back()}>
        <BackIcon width={40} height={40} />
        </TouchableOpacity>
      </View>

      <View className="flex-row mb-8 mt-3 bg-neutral700 rounded-xl">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-xl ${
            displayedKeyType === '12' ? 'bg-white' : ''
          }`}
          onPress={() => handleKeyTypeSwitch('12')}
        >
          <Text
            className={`text-center font-sora ${
              displayedKeyType === '12'
                ? 'text-black font-sora-semibold'
                : 'text-neutral200'
            }`}
          >
            12 Keys
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 rounded-xl ${
            displayedKeyType === '24' ? 'bg-white' : ''
          }`}
          onPress={() => handleKeyTypeSwitch('24')}
          disabled={keyCount === '12'}
        >
          <Text
            className={`text-center font-sora ${
              displayedKeyType === '24'
                ? 'text-black font-sora-semibold'
                : 'text-neutral200'
            }`}
          >
            24 Keys
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="my-5">
        <View className="bg-white/10 rounded-xl pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4">
            <TouchableOpacity
              onPress={() => setIsConcealed(!isConcealed)}
              className="flex-row items-center mb-3 mt-2"
            >
              <Image
                source={isConcealed ? EyeClosedIcon : EyeIcon}
                className="mr-2"
                resizeMode="contain"
              />
              <Text className="text-neutral200 font-sora text-xs">
                {isConcealed ? 'Reveal' : 'Conceal'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCopyPhrases}
              className="flex-row items-center mb-3 mt-2"
            >
              {copiedFeedback ? (
                <>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                  <Text className="text-[#4CAF50] font-sora text-xs ml-2">Copied</Text>
                </>
              ) : (
                <>
                  <Image
                    source={CopyIcon}
                    className="mr-2"
                    resizeMode="contain"
                  />
                  <Text className="text-neutral200 font-sora text-xs">Copy</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {phrases.length > 0 ? renderPhraseBoxes(start, end) : (
            <Text className="text-white text-center p-4">No phrases found for this wallet.</Text>
          )}
        </View>

        {displayedKeyType === '24' && (
          <View className="flex-row items-center justify-between mt-10 px-4">
            <TouchableOpacity onPress={() => setPage(1)} disabled={isFirstPage}>
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

            <TouchableOpacity onPress={() => setPage(2)} disabled={isLastPage}>
              <Image source={ArrowRight} style={{ opacity: isLastPage ? 0.5 : 1 }} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}