import { BackIcon, Lock_3 } from '@/assets/images/svg';
import { useSetFingerprintComplete } from '@/store/useAuthStore';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import CenterImage from '../../../../../assets/images/fingerprint.png';

export default function Fingerprint() {
  const router = useRouter();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const setFingerprintComplete = useSetFingerprintComplete();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      Alert.alert('Device Error', 'Your device does not support biometric authentication.');
      setIsBiometricAvailable(false);
      return;
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      Alert.alert('Setup Required', 'No fingerprint or face ID is enrolled on your device. Please set up biometrics in your device settings.');
      setIsBiometricAvailable(false);
      return;
    }

    setIsBiometricAvailable(true);
  };

  const handleFingerprintScan = async () => {
    if (!isBiometricAvailable || isAuthenticating) return;

    setIsAuthenticating(true);
    setCompletionPercentage(0);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to proceed',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setCompletionPercentage(100);
        // Update the store to mark fingerprint as complete
        setFingerprintComplete();
        router.push('/(auth)/sign-up/biometrics?fingerprintCompleted=true');
      } else {
        setCompletionPercentage(0);
        if (result.error === 'user_fallback') {
          Alert.alert('Authentication Canceled', 'You chose to use a fallback method.');
        } else if (result.error === 'user_cancel') {
          Alert.alert('Authentication Canceled', 'You canceled the fingerprint scan.');
        } else if (result.error === 'system_cancel' || result.error === 'app_cancel') {
          Alert.alert('Authentication Failed', 'The authentication process was interrupted. Please try again.');
        } else if (result.error === 'lockout' || result.error === 'too_many_attempts') {
          Alert.alert('Authentication Failed', 'Too many failed attempts. Biometric authentication is temporarily locked. Please try again later or use your device passcode/PIN.');
        } else {
          Alert.alert('Authentication Failed', `Incorrect fingerprint. Please try again. Error: ${result.error || 'Unknown'}`);
        }
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', `An unexpected error occurred during authentication: ${error.message || 'Unknown error'}`);
      setCompletionPercentage(0);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleProceed = () => {
    if (completionPercentage === 100) {
      router.push('/(home)');
    } else {
      Alert.alert('Action Required', 'Please successfully verify your fingerprint before proceeding.');
    }
  };

  return (
    <TouchableWithoutFeedback>
      <View className="flex-1 px-5 ">
        <View className="relative flex-row items-center justify-start mb-4">
          <TouchableOpacity className="z-10" onPress={() => router.back()}>
          <BackIcon width={40} height={40} /> 
           </TouchableOpacity>
           <Lock_3 
        style={{
          position: 'absolute',
          left: '50%',
          transform: [{ translateX: '-50%' }]
        }} />
        </View>

        <View className="flex-1 items-center justify-center">
          <TouchableOpacity
            onPress={handleFingerprintScan}
            disabled={isAuthenticating || !isBiometricAvailable}
          >
            <Image
              source={CenterImage}
              className="w-[150px] h-[150px]"
              resizeMode="contain"
              style={{ opacity: isAuthenticating ? 0.6 : 1 }}
            />
          </TouchableOpacity>
          
          <View className="mb-8 px-2">
          <Text className="text-white font-sora text-sm text-center mt-5" numberOfLines={3}>
            Touch the fingerprint icon to verify your identity
          </Text>
        </View>
        </View>
       
      </View>
    </TouchableWithoutFeedback>
  );
}