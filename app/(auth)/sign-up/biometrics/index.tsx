import { Lock_3 } from '@/assets/images/svg';
import Button from '@/components/Button';
import {
  useCompletedBiometrics,
  useSetFingerprintComplete,
  useSetIrisComplete,
  useSetVoiceComplete
} from '@/store/useAuthStore';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Method1Image from '../../../../assets/images/Method1Image.png';
import Method2Image from '../../../../assets/images/Method2Image.png';
import Method3Image from '../../../../assets/images/Method3Image.png';
import Method4Image from '../../../../assets/images/Method4Image.png';

export default function Biometrics() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [showUnavailableMessage, setShowUnavailableMessage] = useState(false);
  const completedBiometrics = useCompletedBiometrics();
  const setFingerprintComplete = useSetFingerprintComplete();
  const setVoiceComplete = useSetVoiceComplete();
  const setIrisComplete = useSetIrisComplete();

  // Memoize the methods to prevent unnecessary recalculations
  const methods = useMemo(() => [
    {
      name: 'Face Scan',
      image: Method1Image,
      route: 'sign-up/biometrics/facescan',
      isCompleted: completedBiometrics.includes('Face I.D'),
    },
    {
      name: 'Fingerprint',
      image: Method2Image,
      route: 'sign-up/biometrics/fingerprint',
      isCompleted: completedBiometrics.includes('Fingerprint'),
    },
    {
      name: 'Voice ID',
      image: Method3Image,
      route: 'sign-up/biometrics/voiceid',
      isCompleted: completedBiometrics.includes('Voice ID'),
    },
    {
      name: 'Iris Scan',
      image: Method4Image,
      route: 'sign-up/biometrics/iris',
      isCompleted: completedBiometrics.includes('Iris Scan'),
    },
  ], [completedBiometrics]);

  // Initialize auth states
  const [authState, setAuthState] = useState(() => {
    const initialActive = ['OTP', 'PIN'];
    if (completedBiometrics.length > 0) {
      initialActive.push(completedBiometrics[0]);
    }
    const allMethods = ['Face I.D', 'Fingerprint', 'Voice ID', 'Iris Scan'];
    const initialInactive = allMethods.filter(m => !initialActive.includes(m));
    return {
      active: initialActive,
      inactive: initialInactive
    };
  });

  const hasCompletedMethod = completedBiometrics.length > 0;

  // Handle params changes without causing infinite loops
  useEffect(() => {
    if (params.faceScanCompleted === 'true') {
      // This will automatically update completedBiometrics via the store
      // No need for additional state updates here
    }
    if (params.fingerprintCompleted === 'true') {
      // Same as above
    }
  }, [params]);

  // Hide the unavailable message after 3 seconds
  useEffect(() => {
    if (showUnavailableMessage) {
      const timer = setTimeout(() => {
        setShowUnavailableMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showUnavailableMessage]);

  const handleMethodPress = (route: string) => {
    if (route.includes('voiceid') || route.includes('iris')) {
      setShowUnavailableMessage(true);
    } else {
      router.push(route);
    }
  };

  const toggleAuth = (method: string, isActive: boolean) => {
    if (method === 'OTP' || method === 'PIN') return;

    setAuthState(prev => {
      if (isActive) {
        return {
          active: prev.active.filter(m => m !== method),
          inactive: [...prev.inactive, method]
        };
      } else {
        if (prev.active.length < 3) {
          return {
            active: [...prev.active, method],
            inactive: prev.inactive.filter(m => m !== method)
          };
        }
        return prev;
      }
    });
  };

  const handleProceed = () => {
    setShowModal(false);
    router.push('/sign-up/did-creation');
  };

  const closeModal = () => setShowModal(false);

  return (
    <View className="flex-1 px-5 mt-5">
      {/* Header */}
      <View className="relative flex-row items-center justify-start mb-16">
      <Lock_3 
        style={{
          position: 'absolute',
          left: '50%',
          transform: [{ translateX: '-50%' }]
        }} />
      </View>

      {/* Content */}
      <View className="flex-1 px-2">
        <Text className="text-white font-sora-bold text-sm mb-2">
          Set up the third security layer to your Safe
        </Text>
        <Text className="text-neutral200 font-sora text-sm mb-12">
          Register only one extra layer to continue. You can always register more later
        </Text>

        {/* Image Grid */}
        <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
          {methods.map((method, index) => {
            const opacityClass = method.isCompleted ? 'opacity-10' : 'opacity-100';
            return (
              <TouchableOpacity
                key={index}
                className={`w-[48%] items-center bg-neutral700 p-4 rounded-xl ${opacityClass}`}
                onPress={() => handleMethodPress(method.route)}
                disabled={method.isCompleted}
              >
                <Image
                  source={method.image}
                  className="w-32 h-32 mb-5"
                  resizeMode="contain"
                />
                <Text className="text-neutral200 font-sora text-center text-base">
                  {method.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Unavailable message */}
        {showUnavailableMessage && (
          <View className="bg-neutral700 p-3 rounded-lg mb-4">
            <Text className="text-white font-sora text-center text-xs">
              This feature is currently not available. Please use another authentication method.
            </Text>
          </View>
        )}
      </View>

      {/* Proceed Button */}
      <View className="pb-16">
        <Button
          text={hasCompletedMethod ? "Do Later" : "Proceed"}
          onPress={() => hasCompletedMethod ? setShowModal(true) : router.push('/sign-up/pinsetup')}
          isDisabled={!hasCompletedMethod}
        />
      </View>

      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View className="flex-1 bg-neutral800/90 justify-end">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              className="w-full"
            >
              <TouchableWithoutFeedback onPress={() => {}}>
                <View className="bg-mainBlack rounded-t-3xl">
                  {/* Handle bar */}
                  <TouchableOpacity className="items-center pt-3" onPress={closeModal}>
                    <View className="w-16 h-1 bg-white rounded-full" />
                  </TouchableOpacity>

                  {/* Title */}
                  <Text className="text-white font-sora-bold text-sm text-center mt-6">
                    Select your Login Authentication path
                  </Text>

                  {/* Active Authentication */}
                  <View className="px-6 mt-10">
                    <Text className="text-neutral200 font-sora text-sm mb-3">
                      Active Authentication Path
                    </Text>

                    {authState.active.map((method, index) => (
                      <TouchableOpacity
                        key={index}
                        className="flex-row items-center py-3"
                        onPress={() => toggleAuth(method, true)}
                        disabled={method === 'OTP' || method === 'PIN'}
                      >
                        <MaterialIcons
                          name={['OTP', 'PIN'].includes(method) ? 'radio-button-checked' : 'radio-button-on'}
                          size={24}
                          color="#FFD700"
                        />
                        <Text className="text-white font-sora ml-3">{method}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Inactive Authentication */}
                  <View className="px-6 mt-8 mb-12">
                    <Text className="text-neutral200 font-sora text-sm mb-3">
                      Inactive Authentication Path
                    </Text>

                    {authState.inactive.map((method, index) => {
                      const isCompleted = completedBiometrics.includes(method);
                      return (
                        <TouchableOpacity
                          key={index}
                          className="flex-row items-center py-3"
                          onPress={() => toggleAuth(method, false)}
                          disabled={!isCompleted && authState.active.length < 3}
                        >
                          <MaterialIcons
                            name="radio-button-off"
                            size={24}
                            color={isCompleted ? "white" : "white"}
                          />
                          <Text className={`font-sora ml-3 ${isCompleted ? 'text-white' : 'text-white'}`}>
                            {method}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Note */}
                  <Text className="text-neutral200 font-sora text-xs text-center px-6 mt-8">
                    <Text className='text-main'>Note:</Text> All other authentication can be changed except 'OTP' and 'PIN'.
                  </Text>

                  {/* Proceed Button */}
                  <View className="px-6 mt-8 mb-16">
                    <Button
                      text="Proceed"
                      onPress={handleProceed}
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}