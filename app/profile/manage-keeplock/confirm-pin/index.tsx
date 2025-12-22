// components/PinEntryScreen.tsx
import { BackIcon } from '@/assets/images/svg';
import Button from '@/components/Button';
import NumericKeypad from '@/components/Keypad';
import { useAuthStore } from '@/store/useAuthMethod';
import { usePhoneStore } from '@/store/usePhoneStore';
import { encryptPhoneData } from '@/utils/phoneEncyption';
import { encryptPinData, verifyPinHash } from '@/utils/pinEncryption';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function PinEntryScreen() {
  const router = useRouter();
  const { 
    userId, 
    walletAddress, 
    userAuthMethods 
  } = useAuthStore();
  
  const { phoneNumber } = usePhoneStore();
  
  const [pin, setPin] = useState(['', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isError, setIsError] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const {setToken} = useAuthStore();
  const handleKeyPress = (num: string) => {
    if (currentIndex < 4) {
      const newPin = [...pin];
      newPin[currentIndex] = num;
      setPin(newPin);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBackspace = () => {
    if (currentIndex > 0) {
      const newPin = [...pin];
      newPin[currentIndex - 1] = '';
      setPin(newPin);
      setCurrentIndex(currentIndex - 1);
    }
    setIsError(false);
  };

  useEffect(() => {
    const enteredPinComplete = pin.every(d => d !== '');
    if (enteredPinComplete) {
      handleSubmit();
    }
  }, [pin]);

// In your PinEntryScreen.tsx - update the handleLoginWithPin function
const handleLoginWithPin = async (enteredPin: string) => {
  try {
    setIsLoading(true);
    
    if (!phoneNumber || !userId || !userAuthMethods) {
      Alert.alert('Error', 'Missing authentication data.');
      return false;
    }

    // Find the stored PIN hash from auth methods
    const storedPinMethod = userAuthMethods.find(method => method.type === 'pin');
    if (!storedPinMethod || !storedPinMethod.data) {
      Alert.alert('Error', 'No PIN method found for this user.');
      return false;
    }

    const storedPinHash = storedPinMethod.data;
    
    console.log('🔐 LOCAL PIN VERIFICATION:');
    console.log('• Stored PIN hash:', storedPinHash);
    
    // Verify PIN locally first
    const pinMatches = verifyPinHash(enteredPin, userId, storedPinHash);
    
    if (!pinMatches) {
      console.log('❌ LOCAL PIN VERIFICATION FAILED');
      Alert.alert('Invalid PIN', 'The PIN you entered is incorrect.');
      return false;
    }

    console.log('✅ LOCAL PIN VERIFICATION SUCCESSFUL');

    // Now proceed with server login
    const phoneEncrypted = encryptPhoneData(phoneNumber);
    const pinEncrypted = encryptPinData(enteredPin, userId);
    
    console.log('🔐 ENCRYPTION DETAILS:');
    console.log('Phone Encrypted:', phoneEncrypted);
    console.log('PIN Encrypted:', pinEncrypted);
    console.log('Expected to match stored:', storedPinHash);

    const loginData = {
      phoneHash: phoneEncrypted,
      authMethod: 'pin',
      pinHash: pinEncrypted,
      authMethods: userAuthMethods
    };

    // ... rest of your API call code
    const response = await fetch('https://k33p-backend-i9kj.onrender.com/api/zk/login-with-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    const result = await response.json();
    console.log(result)

    if (result.success) {
      console.log('✅ SERVER LOGIN SUCCESSFUL');
      setToken(result.data.token);
      console.log('Token:', result.data.token);
      
      return true;
    } else {
      console.log('❌ SERVER LOGIN FAILED');
      Alert.alert('Login Failed', result.error?.message || 'Server authentication failed.');
      return false;
    }
  } catch (error) {
    console.error('💥 NETWORK ERROR:', error);
    Alert.alert('Connection Error', 'Failed to connect to server.');
    return false;
  } finally {
    setIsLoading(false);
  }
};

  const handleSubmit = async () => {
    const enteredPin = pin.join('');
    
    if (enteredPin.length !== 4) {
      setIsError(true);
      setTimeout(() => {
        setPin(['', '', '', '']);
        setCurrentIndex(0);
        setIsError(false);
      }, 1000);
      return;
    }

    console.log('🎯 PIN SUBMISSION STARTED');
    console.log('Entered PIN: **** (hidden for security)');
    console.log('User ID:', userId);
    console.log('Phone Number:', phoneNumber ? `${phoneNumber.substring(0, 3)}...${phoneNumber.substring(phoneNumber.length - 2)}` : 'not set');
    console.log('Has Auth Methods:', !!userAuthMethods);
    console.log('Auth Method Types:', userAuthMethods?.map(m => m.type));

    const loginSuccess = await handleLoginWithPin(enteredPin);
    
    if (loginSuccess) {
      console.log('🎉 PIN VERIFICATION SUCCESSFUL - NAVIGATING TO NEXT SCREEN');
      setIsUnlocked(true);
      setTimeout(() => {
        router.replace('/profile/manage-keeplock');
      }, 500);
    } else {
      console.log('🚫 PIN VERIFICATION FAILED - RESETTING INPUT');
      setIsError(true);
      setTimeout(() => {
        setPin(['', '', '', '']);
        setCurrentIndex(0);
        setIsError(false);
      }, 1000);
    }
  };

  const focusPinCircle = (index: number) => {
    setCurrentIndex(index);
    setShowKeypad(true);
  };

  // Show error if critical data is missing
  if (!phoneNumber || !userId || !userAuthMethods) {
    console.log('🚨 MISSING AUTH DATA IN PIN SCREEN:');
    console.log('• Phone number:', phoneNumber ? 'set' : 'missing');
    console.log('• User ID:', userId ? 'set' : 'missing');
    console.log('• Auth methods:', userAuthMethods ? `present (${userAuthMethods.length})` : 'missing');
    
    return (
      <View className="flex-1 px-5 justify-center items-center">
        <Text className="text-white text-center mb-4 font-sora">
          Missing authentication data. Please go back and try again.
        </Text>
        <Button 
          text="Go Back" 
          onPress={() => router.back()} 
        />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => setShowKeypad(false)}>
      <View className="flex-1 px-5">
        <View className="relative flex-row items-center justify-start mb-12">
          <TouchableOpacity className="z-10" onPress={() => router.back()}>
            <BackIcon width={40} height={40} />
          </TouchableOpacity>
          
        </View>

        <View className="flex-1">
          <Text className="text-white font-sora-bold text-sm text-center mb-1">
            Enter your PIN
          </Text>
          <Text className="text-sm font-sora text-center mb-6 px-8 py-2 text-neutral200">
            {isError
              ? 'Incorrect PIN, try again'
              : 'Enter your 4-digit PIN'}
          </Text>

          <View className="flex-row justify-center mb-2">
            {pin.map((digit, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={1}
                onPress={() => focusPinCircle(index)}
                className={`w-6 h-6 mx-3 rounded-full border items-center justify-center ${
                  isUnlocked
                    ? 'bg-success500 border-green-500'
                    : isError
                    ? 'border-error500'
                    : digit !== ''
                    ? 'bg-neutral200 border-neutral200'
                    : 'border-neutral200'
                }`}
              />
            ))}
          </View>
        </View>

        <View className={`pb-16 ${showKeypad ? 'mb-72' : ''}`}>
          <Button
            text={isLoading ? "Verifying..." : "Continue"}
            onPress={handleSubmit}
            isDisabled={pin.some(d => d === '')}
            isLoading={isLoading}
          />
        </View>

        {showKeypad && (
          <TouchableWithoutFeedback onPress={() => setShowKeypad(false)}>
            <View className="absolute top-0 left-0 right-0 bottom-80 bg-transparent" style={{ bottom: 400 }} />
          </TouchableWithoutFeedback>
        )}

        <NumericKeypad
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          isVisible={showKeypad}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}