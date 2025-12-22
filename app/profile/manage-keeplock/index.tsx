import { BackIcon, FACE_KEEPLOCK, FINGERPRINT_KEEPLOCK, IRIS_KEEPLOCK, PIN_KEEPLOCK, VOICE_KEEPLOCK } from '@/assets/images/svg';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import { AuthMethod, useAuthStore } from '@/store/useAuthMethod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export default function Keeplock() {
  const router = useRouter();
  const { userAuthMethods } = useAuthStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedOption, setSelectedOption] = useState<{
    id: number;
    name: string;
    type: string;
    isEnabled: boolean;
  } | null>(null);

  const keeplockOptions = [
    { 
      id: 1, 
      name: 'PIN', 
      image: PIN_KEEPLOCK, 
      route: '/keeplock/pin',
      type: 'pin'
    },
    { 
      id: 2, 
      name: 'Fingerprint', 
      image: FINGERPRINT_KEEPLOCK, 
      route: '/keeplock/fingerprint',
      type: 'fingerprint'
    },
    { 
      id: 3, 
      name: 'Face ID', 
      image: FACE_KEEPLOCK, 
      route: '/keeplock/face',
      type: 'face'
    },
    { 
      id: 4, 
      name: 'Iris Scan', 
      image: IRIS_KEEPLOCK, 
      route: '/keeplock/iris',
      type: 'iris'
    },
    { 
      id: 5, 
      name: 'Voice I.D', 
      image: VOICE_KEEPLOCK, 
      route: '/keeplock/voice',
      type: 'voice'
    },
  ];

  const isMethodEnabled = (methodType: string): boolean => {
    if (!userAuthMethods || userAuthMethods.length === 0) {
      return false;
    }
    
    const searchTerm = methodType.toLowerCase();
    return userAuthMethods.some((method: AuthMethod) => {
      const methodTypeLower = method.type.toLowerCase();
      return methodTypeLower.includes(searchTerm) || searchTerm.includes(methodTypeLower);
    });
  };

  const getEnabledMethodsCount = (): number => {
    return userAuthMethods?.length || 0;
  };

  const hasMultipleMethodsEnabled = (): boolean => {
    return getEnabledMethodsCount() > 3;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleOptionPress = (option: typeof keeplockOptions[0]) => {
    const isEnabled = isMethodEnabled(option.type);
    
    if (['iris', 'face', 'voice'].includes(option.type)) {
      setSelectedOption({
        id: option.id,
        name: option.name,
        type: option.type,
        isEnabled
      });
      setModalVisible(true);
      return;
    }
    
    if (option.type === 'pin') {
      if (isEnabled) {
        setSelectedOption({
          id: option.id,
          name: option.name,
          type: option.type,
          isEnabled
        });
        setModalVisible(true);
      } else {
        router.push(option.route);
      }
      return;
    }
    
    if (option.type === 'fingerprint') {
      if (isEnabled) {
        setSelectedOption({
          id: option.id,
          name: option.name,
          type: option.type,
          isEnabled
        });
        setModalVisible(true);
      } else {
        router.push(option.route);
      }
      return;
    }
  };

  const handleRemoveDefault = () => {
    if (!selectedOption) {
      setModalVisible(false);
      return;
    }

    if (hasMultipleMethodsEnabled()) {
      setModalVisible(false);
      console.log(`Can remove ${selectedOption.name} as default - ${getEnabledMethodsCount()} methods enabled`);
      showToast(`${selectedOption.name} can be removed as default`);
      setTimeout(() => {
        setModalVisible(false);
        setSelectedOption(null);
      }, 1000);
    } else {
      setModalVisible(false);

      showToast('You need at least 3 enabled methods to set a default');
    }
  };

  const handleModalAction = (action: 'update' | 'remove') => {
    if (!selectedOption) {
      setModalVisible(false);
      return;
    }

    switch (action) {
      case 'update':
        if (selectedOption.type === 'pin') {
          router.push('/profile/manage-keeplock/update-pin');
        } 
        break;
      
      case 'remove':
        handleRemoveDefault();
        return;
      
     
    }
  };

  

  const renderModalContent = () => {
    if (!selectedOption) return null;

    if (['iris', 'face', 'voice'].includes(selectedOption.type)) {
      return (
        <View className="bg-[#181818] rounded-2xl p-6 w-full max-w-sm">
          <View className="items-center ">
          <Video 
          source={require('../../../assets/animation/hourglass.mp4')}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="contain"
          shouldPlay
          isLooping
          useNativeControls={false}
          style={{ width: 50, height: 50 }}
        /> 
            <Text className="text-white font-sora-bold text-sm text-center mb-2 mt-4">
              Coming Soon
            </Text>
            <Text className="text-neutral100 font-sora text-sm text-center mb-2">
            This service is still under construction and will be released in the beta version.
            </Text>
            
          </View>
        </View>
      );
    }

    if (selectedOption.type === 'pin') {
      return (
        <View className="bg-neutral800 rounded-2xl p-6 w-full max-w-sm">
          <View className="items-center gap-5">
            
            <Button
              text="Register New PIN"
              onPress={() => handleModalAction('update')}
              outline={false} 
            />
            
            <Button
              text="Remove as Default"
              onPress={() => handleModalAction('remove')}
              outline={true}
              
            />
            
          
          </View>
        </View>
      );
    }

    if (selectedOption.type === 'fingerprint') {
      return (
        <View className="bg-neutral800 rounded-2xl p-6 w-full max-w-sm">
          <View className="items-center gap-5">
            
            <Button
              text="Remove as Default"
              onPress={() => handleModalAction('remove')}
              outline={true}
              
            />
           
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between mb-6 border-b border-neutral300 pb-4">
        <TouchableOpacity onPress={() => router.back()} className='px-4'>
          <BackIcon/>
        </TouchableOpacity>
        <Text className="text-white font-sora-bold text-sm">Manage KeepLock</Text>
        <View className="w-10" />
      </View>
     
      <Text className='text-neutral200 font-sora-semibold text-sm px-6 mb-5'>
        Register new or set default security layer when signing in
      </Text>
      <ScrollView
  className="flex-1"
  contentContainerStyle={{ paddingTop: 10, paddingBottom:20 }}
  showsVerticalScrollIndicator={false}
>
      <View className="px-4">
        <View className="flex-row flex-wrap -mx-2">
          {keeplockOptions.map((option, index) => {
            const isEnabled = isMethodEnabled(option.type);
            
            return (
              <View 
                key={option.id} 
                className="w-1/2 px-2 mb-12 mt-5"
              >
                <TouchableOpacity 
                  onPress={() => handleOptionPress(option)}
                  className="items-center justify-center h-40 relative"
                  activeOpacity={0.7}
                >
                  <View className="relative mb-5">
                    <View className="flex-1 justify-center items-center">
                      {React.createElement(option.image)}
                    </View>
                    
                    {isEnabled && (
                      <View className="absolute -top-5 -right-5">
                        <MaterialCommunityIcons name="checkbox-marked-circle" size={22} color="#FFD939" />
                      </View>
                    )}
                  </View>
                  
                  <View className="flex-row items-center">
                    <Text className={`font-sora-semibold text-lg text-neutral200`}>
                      {option.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedOption(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setModalVisible(false);
          setSelectedOption(null);
        }}>
          <View className="flex-1 bg-black/80 justify-center items-center p-6">
            <TouchableWithoutFeedback>
              {renderModalContent()}
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        duration={3000}
      />
    </View>
  );
}