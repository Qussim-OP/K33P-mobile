import Button from '@/components/Button';
import NumericKeypad from '@/components/Keypad';
import { usePhoneStore } from '@/store/usePhoneStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { BackIcon, Lock_1 } from '../../../assets/images/svg';

export default function PhoneEntryScreen() {
  const router = useRouter();
  const [rawPhoneNumber, setRawPhoneNumber] = useState('');
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { 
    phoneNumber, 
    formattedNumber,
    setPhoneNumber,
    setFormattedNumber
  } = usePhoneStore();
  
  useEffect(() => {
    if (phoneNumber.length > 0) {
      let formatted = '+';
      formatted += phoneNumber.substring(0, 3);
      if (phoneNumber.length > 3) formatted += '-' + phoneNumber.substring(3, 6);
      if (phoneNumber.length > 6) formatted += '-' + phoneNumber.substring(6, 10);
      if (phoneNumber.length > 10) formatted += '-' + phoneNumber.substring(10, 13);
      setFormattedNumber(formatted);
    } else {
      setFormattedNumber('');
    }
  }, [phoneNumber, setFormattedNumber]);

  const handlePhoneChange = (text: string) => {
    const cleanedNumber = text.replace(/\D/g, '');
    setPhoneNumber(cleanedNumber); // Use the store setter
    setIsValid(cleanedNumber.length === 13);
    setIsTouched(true);
  };

  const handleKeyPress = (num: string) => {
    const newNumber = phoneNumber + num; 
    if (newNumber.length <= 13) {
      setPhoneNumber(newNumber); 
      setIsValid(newNumber.length === 13);
      setIsTouched(true);
    }
  };

  useEffect(() => {
    if (phoneNumber.length == 13) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [phoneNumber]);

  const handleBackspace = () => {
    const newNumber = phoneNumber.slice(0, -1); // Use the store value
    setPhoneNumber(newNumber); 
    setIsValid(newNumber.length === 13);
    setIsTouched(true);
  };

  const handleProceed = () => {
    console.log('Entered phone number:', formattedNumber);
    router.push('/sign-up/otp');
  };

  const showError = isTouched && !isValid && phoneNumber.length > 0;

  return (
    <View className="flex-1 px-5">
      {/* Header */}
      <View className="relative flex-row items-center justify-start mb-12">
        <TouchableOpacity className="z-10" onPress={() => router.back()}>
          <BackIcon width={40} height={40} />

        </TouchableOpacity>
        <Lock_1 
        style={{
          position: 'absolute',
          left: '50%',
          transform: [{ translateX: '-50%' }]
        }}
      />
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className="text-white font-sora text-sm  mb-4">
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
              className={` rounded-lg  px-5 py-3 mb-2 ${
                showError ? 'text-error500' : 'text-white'
              } font-sora text-sm mb-1 border ${
                isFocused ? 'border-white' : 'border-neutral200'
              }`}
              placeholder="+234-801-2345-678"
              placeholderTextColor="#969696"
              keyboardType="phone-pad"
              value={formattedNumber}
              onChangeText={handlePhoneChange}
              maxLength={18} // +xxx-xxx-xxxx-xxx is 18 characters
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
      <View className={`pb-16 ${showKeypad ? 'mb-72' : ''}`}>
        <Button
          text="Proceed"
          onPress={handleProceed}
          isDisabled={!isValid }
        />
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