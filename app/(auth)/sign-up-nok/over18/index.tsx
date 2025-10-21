import { BackIcon, OVER18_0 } from '@/assets/images/svg';
import Button from '@/components/Button';
import NumericKeypad from '@/components/Keypad';
import { useNokPhoneStore } from '@/store/useNokPhoneScreen';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function NokPhoneEntryScreen() {
  const router = useRouter();
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { 
    nokPhoneNumber, 
    nokFormattedNumber,
    setNokPhoneNumber,
    setNokFormattedNumber
  } = useNokPhoneStore();
  
  useEffect(() => {
    if (nokPhoneNumber.length > 0) {
      let formatted = '+';
      formatted += nokPhoneNumber.substring(0, 3);
      if (nokPhoneNumber.length > 3) formatted += '-' + nokPhoneNumber.substring(3, 6);
      if (nokPhoneNumber.length > 6) formatted += '-' + nokPhoneNumber.substring(6, 10);
      if (nokPhoneNumber.length > 10) formatted += '-' + nokPhoneNumber.substring(10, 13);
      setNokFormattedNumber(formatted);
    } else {
      setNokFormattedNumber('');
    }
  }, [nokPhoneNumber, setNokFormattedNumber]);

  const handlePhoneChange = (text: string) => {
    const cleanedNumber = text.replace(/\D/g, '');
    setNokPhoneNumber(cleanedNumber);
    setIsValid(cleanedNumber.length === 13);
    setIsTouched(true);
  };

  const handleKeyPress = (num: string) => {
    const newNumber = nokPhoneNumber + num; 
    if (newNumber.length <= 13) {
      setNokPhoneNumber(newNumber); 
      setIsValid(newNumber.length === 13);
      setIsTouched(true);
    }
  };

  useEffect(() => {
    if (nokPhoneNumber.length == 13) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [nokPhoneNumber]);

  const handleBackspace = () => {
    const newNumber = nokPhoneNumber.slice(0, -1);
    setNokPhoneNumber(newNumber); 
    setIsValid(newNumber.length === 13);
    setIsTouched(true);
  };

  const handleProceed = () => {
    console.log('Entered NOK phone number:', nokFormattedNumber);
    router.push('/(auth)/sign-up-nok/over18/otp');
  };

  const showError = isTouched && !isValid && nokPhoneNumber.length > 0;

  return (
    <View className="flex-1 px-5">
      {/* Header */}
      <View className="relative flex-row items-center justify-start mb-12">
        <TouchableOpacity className="z-10" onPress={() => router.back()}>
          <BackIcon width={40} height={40} />

        </TouchableOpacity>
        <OVER18_0 
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
          Enter NOK Phone Number
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
                showError ? 'text-error500' : 'text-white'
              } font-sora text-sm mb-1 border ${
                isFocused ? 'border-white' : 'border-neutral200'
              }`}
              placeholder="+234-801-2345-678"
              placeholderTextColor="#969696"
              keyboardType="phone-pad"
              value={nokFormattedNumber}
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
      </View>

      {/* Footer */}
      <View className={`pb-16 ${showKeypad ? 'mb-80' : ''}`}>
        <Button
          text="Proceed"
          onPress={handleProceed}
          isDisabled={!isValid}
        />
      </View>

      {/* Keypad Handling */}
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

      <NumericKeypad
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        isVisible={showKeypad}
      />
    </View>
  );
}