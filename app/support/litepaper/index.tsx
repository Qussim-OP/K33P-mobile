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
      text: "K33P is a cutting-edge digital safe designed for securely managing cryptocurrency wallet seed phrases. By leveraging advanced encryption, biometric security, zero-knowledge proofs, and blockchain technology, K33P ensures that users maintain full control over their seed phrases information while eliminating the risks associated with traditional storage methods and user-friendly solution. Like a physical safe, it safeguards sensitive information in a digital vault, accessible only to its rightful owner."
    },
    {
      id: 2,
      heading: null,
      text: "By removing the hassle of writing down 24 or 15 word recovery keys and simplifying complex recovery procedures, K33P reduces anxiety over potential loss and ensures seamless, secure access to your wealth."
    },
    {
      id: 3,
      heading: "K33P adheres to the core principles of decentralization and self-sovereignty by design?",
      text: "Biometric authentication – Eliminates need to remember passwords or store physical copies. (E.g Face I.D, PIN, Fingerprint, Iris scan, Voice I.D)\nZero-Knowledge Proofs (ZK Privacy) – Ensures full privacy and regulatory compliance.\nDecentralized storage architecture – Eliminates single points of failure."
    },
    {
      id: 4,
      heading: null,
      text: "Seamless recovery – Simplifies identity recovery system. (account DID verification + PIN).\nAt K33P, security and privacy are our top priorities. With K33P Vault, ownership is verifiable and indisputable, users are exactly who they claim to be, and no one else can impersonate them. Experience secure, private, and trustless digital signatures, redefining identity protection."
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
              Lightpaper
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
            <Text className='text-neutral100 text-xs font-space-mono mb-2'>About K33P Lightpaper</Text>
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