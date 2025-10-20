import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import { BackIcon, PHONE } from '@/assets/images/svg';
import Button from '@/components/Button';
import SearchIcon from '../../../assets/images/search.png';

const highlightSearch = (text: string, query: string) => {
  if (!query) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? (
      <Text key={i} className="text-main">{part}</Text>
    ) : (
      part
    )
  );
};

const content = [
  {
    id: 1,
    heading: null,
    text: "K33P is a self-custodial digital vault that helps you securely store and recover your wallet seed phrases. It uses biometric authentication, account decentralized identification (DID), and encrypted off-chain storage Iagon to ensure that only you can access your vault, even if your device is lost or stolen. K33P is privacy-first, user-friendly, and built on Cardano's secure blockchain infrastructure. No one, not even K33P, can view the content of your vault."
  },
  {
    id: 2,
    heading: "What authentication methods does K33P use?",
    text: "K33P uses multi-factor authentication including biometric verification (Face I.D/Fingerprint/Voice I.D/Iris scan), a passkey (PIN), and an optional OTP (One-Time Password) sent to your phone. These combine with your on-chain account identification to ensure only you can access your vault."
  },
  {
    id: 3,
    heading: "What if I forget my password or lose biometric access e.g if i forget my PIN?",
    text: "You can recover your account using your registered phone with an identity verification. Once verified, you'll be prompted to re-register a new biometrics authentication."
  },
  {
    id: 4,
    heading: "Is my biometric data stored on K33P servers?",
    text: "No. Your biometric data is only stored locally on your device with an encrypted copy on decentralized storage (Iagon) and used for authentication. K33P never stores or transmits your biometrics or any of your information."
  }
];

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const supportPhoneNumber = '+2348135005000';

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleCallSupport = async () => {
    setIsCalling(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const phoneUrl = `tel:${supportPhoneNumber}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        console.error("Phone calls are not supported on this device");
      }
    } catch (error) {
      console.error('Failed to open phone dialer:', error);
    } finally {
      setIsCalling(false);
      closeModal();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => {
      if (isKeyboardVisible) {
        Keyboard.dismiss();
      }
    }}>
      <View className="flex-1">
        {/* Header - Fixed Position */}
        <View className="mb-4 pb-4 ">
          <TouchableOpacity onPress={() => router.back()} className="absolute left-4 z-10">
          <BackIcon
              style={{
                left: '50%',
                transform: [{ translateX: '-50%' }],
              }}
            />
          </TouchableOpacity>

          <View className="items-center justify-center">
            <Text className='text-sm text-white font-sora-bold mt-3'>
              Authentication
            </Text>
          </View>

          <TouchableOpacity 
            onPress={openModal}
            className="absolute right-4 mt-2"
          >
            <PHONE
              style={{
                left: '50%',
                transform: [{ translateX: '-50%' }],
              }}
            />
          </TouchableOpacity>
        </View>


        <View className="px-4 mb-4 mt-1">
          <View className="flex-row items-center bg-searchBg rounded-xl px-3 py-1">
            <Image 
              source={SearchIcon} 
              className="w-4 h-4 mr-2" 
              resizeMode="contain" 
            />
            <TextInput
              ref={searchInputRef}
              className="flex-1 ml-1 text-white font-sora text-sm"
              placeholder="Search.."
              placeholderTextColor="#B0B0B0"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsKeyboardVisible(true)}
            />
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          decelerationRate="normal"
        >
          <View className='p-4 rounded-lg mt-4 bg-[#222222]'>
            <Text className='text-neutral100 text-xs font-space-mono mb-2'>About K33P Authentication</Text>
            {content.map((section) => (
              <View key={section.id} className="mb-6">
                {section.heading && (
                  <Text className="text-main font-sora-bold text-sm mb-4" style={{textDecorationLine: 'underline'}}>
                    {highlightSearch(section.heading, searchQuery)}
                  </Text>
                )}
                <Text className="text-white font-sora text-sm leading-relaxed">
                  {section.id === 1 ? (
                    <>
                      <Text className="text-main">
                        {highlightSearch('K33P', searchQuery)}
                      </Text>
                      {highlightSearch(section.text.substring(4), searchQuery)}
                    </>
                  ) : (
                    highlightSearch(section.text, searchQuery)
                  )}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Phone Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <Pressable 
            onPress={closeModal} 
            className="absolute inset-0 bg-black/60"
          />
          <View className="flex-1 justify-center items-center">
            <View className="bg-mainBlack rounded-3xl p-6 w-4/5">
              <Text className="text-white font-sora text-sm text-center mb-6">
                {supportPhoneNumber}
              </Text>
              
              {isCalling ? (
                <View className="py-3 rounded-xl items-center justify-center bg-main">
                  <ActivityIndicator size="small" color="#000000" />
                </View>
              ) : (
                <Button 
                  text="Call Support" 
                  onPress={handleCallSupport}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}