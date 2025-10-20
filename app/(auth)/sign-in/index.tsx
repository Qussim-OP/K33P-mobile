import { BackIcon, SIGN_IN_0 } from '@/assets/images/svg';
import Button from '@/components/Button';
import NumericKeypad from '@/components/Keypad';
import { usePhoneStore } from '@/store/usePhoneStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function PhoneEntryScreen() {
  const router = useRouter();
  const {
    phoneNumber, 
    formattedNumber, 
    setPhoneNumber, 
    setFormattedNumber, 
  } = usePhoneStore();

  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format phone number as +xxx-xxx-xxxx-xxx
  useEffect(() => {
    if (phoneNumber.length > 0) {
      let formatted = '+';
      if (phoneNumber.length > 0) {
        formatted += phoneNumber.substring(0, 3);
      }
      if (phoneNumber.length > 3) {
        formatted += '-' + phoneNumber.substring(3, 6);
      }
      if (phoneNumber.length > 6) {
        formatted += '-' + phoneNumber.substring(6, 10);
      }
      if (phoneNumber.length > 10) {
        formatted += '-' + phoneNumber.substring(10, 13);
      }
      setFormattedNumber(formatted);
    } else {
      setFormattedNumber('');
    }
  }, [phoneNumber, setFormattedNumber]);

  const handlePhoneChange = (text: string) => {
    const cleanedNumber = text.replace(/\D/g, '');
    setPhoneNumber(cleanedNumber);
    setIsValid(cleanedNumber.length === 13);
    setIsTouched(true);
    setError(null); // Clear error when user types
  };

  const handleKeyPress = (num: string) => {
    const newNumber = phoneNumber + num;
    if (newNumber.length <= 13) {
      setPhoneNumber(newNumber);
      setIsValid(newNumber.length === 13);
      setIsTouched(true);
      setError(null); // Clear error when user types
    }
  };

  const handleBackspace = () => {
    const newNumber = phoneNumber.slice(0, -1);
    setPhoneNumber(newNumber);
    setIsValid(newNumber.length === 13);
    setIsTouched(true);
    setError(null); // Clear error when user types
  };

  const checkUserExists = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('https://k33p-backend-i9kj.onrender.com/api/zk/login-with-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedNumber
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return true;
      } else {
        setError(data.error?.message || 'User not found');
        return false;
      } 
    } catch (error) {
      console.error('Error checking user:', error);
      setError('Network error. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceed = async () => {
    if (!isValid) return;

    /* const userExists = await checkUserExists();
    if (userExists) {
      console.log('User found, proceeding to OTP:', formattedNumber);
      router.push('/sign-in/otp');
    } */
    router.push('/sign-in/otp');

  };

  const handleNOK = () => {
    console.log('Login as NOK');
    //router.push('/sign-in-nok');
  };

  const showError = isTouched && !isValid && phoneNumber.length > 0;
  const showNOKButton = !showKeypad;

  useEffect(() => {
    if (phoneNumber.length == 13) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [phoneNumber]);

  return (
    <View className="flex-1 px-5 ">
      {/* Header */}
      <View className="relative flex-row items-center justify-start mb-12">
      <TouchableOpacity className="z-10" onPress={() => router.back()}>
          <BackIcon width={40} height={40} />

        </TouchableOpacity>
        <SIGN_IN_0 
        style={{
          position: 'absolute',
          left: '50%',
          transform: [{ translateX: '-50%' }]
        }}
      />
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className="text-white font-sora text-sm mb-4">
          Enter Phone Number
        </Text>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowKeypad(true);
            Keyboard.dismiss();
            setIsFocused(true);
          }}
        >
          <View pointerEvents="none">
            <TextInput
              className={`rounded-lg px-5 py-3 mb-2 ${
                error ? 'text-error500 border-error500' : 
                showError ? 'text-error500 border-error500' : 'text-white border-neutral200'
              } font-sora text-sm border ${
                isFocused ? 'border-white' : 'border-neutral200'
              }`}
              placeholder="+234-801-2345-678"
              placeholderTextColor="#969696"
              keyboardType="phone-pad"
              value={formattedNumber}
              onChangeText={handlePhoneChange}
              maxLength={18}
              showSoftInputOnFocus={false}
              onFocus={() => {
                setShowKeypad(true);
                setIsFocused(true);
              }}
            />
          </View>
        </TouchableOpacity>

        {showError && (
          <Text className="text-error500 font-sora text-center text-sm p-2">
            Phone number must be 13 digits (including country code)
          </Text>
        )}

        {error && (
          <Text className="text-error500 font-sora text-center text-sm p-2">
            {error}
          </Text>
        )}
      </View>

      {/* Footer */}
      <View className={`pb-5 ${showKeypad ? 'mb-80' : ''}`}>
        <Button
          text={isLoading ? "Checking..." : "Proceed"}
          onPress={handleProceed}
          isDisabled={!isValid || isLoading}
        />

        {showNOKButton && (
          <View className='mt-5 mb-8'>
            <Button
              text="Login as NOK"
              onPress={handleNOK}
              outline
            />
          </View>
        )}
      </View>

      {/* Dismiss Keypad Overlay */}
      {showKeypad && (
        <TouchableWithoutFeedback
          onPress={() => {
            setShowKeypad(false);
            setIsFocused(false);
          }}
        >
          <View className="absolute top-0 left-0 right-0 bottom-80" />
        </TouchableWithoutFeedback>
      )}

      {/* Custom Numeric Keypad */}
      <NumericKeypad
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        isVisible={showKeypad}
      />
    </View>
  );
}