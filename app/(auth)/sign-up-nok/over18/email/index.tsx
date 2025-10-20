import { BackIcon, OVER18_1 } from '@/assets/images/svg';
import Button from '@/components/Button';
import { useNokEmailStore } from '@/store/useNokEmailStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export default function NokEmailEntryScreen() {
  const router = useRouter();
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const { 
    nokEmail, 
    setNokEmail
  } = useNokEmailStore();

  // Check initial validity when component mounts
  useEffect(() => {
    if (nokEmail) {
      setIsValid(validateEmail(nokEmail));
      setIsTouched(true);
    }
  }, []);

  // Keyboard listeners
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

  // Email validation regex
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setNokEmail(text);
    setIsValid(validateEmail(text));
    setIsTouched(true);
  };

  const handleProceed = () => {
    console.log('Entered NOK email:', nokEmail);
    // Navigate to OTP screen and pass the email as a parameter
    router.push({
      pathname: '/(auth)/sign-up-nok/over18/email-otp',
      params: { email: nokEmail }
    });
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsFocused(false);
  };

  const showError = isTouched && !isValid && nokEmail.length > 0;

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 px-5 "
        >
          {/* Header */}
          <View className="relative flex-row items-center justify-start mb-12">
            <TouchableOpacity className="z-10" onPress={() => router.back()}>
              <BackIcon width={40} height={40} />
            </TouchableOpacity>
            
            <OVER18_1 
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
              Enter NOK E-mail Address
            </Text>

            <TextInput
              className={`rounded-lg px-5 py-3 mb-2 ${
                showError ? 'text-error500 border-error500' : 'text-white border-neutral200'
              } font-sora text-sm mb-1 border-2 ${
                isFocused ? 'border-white' : 'border-neutral200'
              }`}
              placeholder="example@email.com"
              placeholderTextColor="#969696"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={nokEmail}
              onChangeText={handleEmailChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              returnKeyType="done"
              onSubmitEditing={dismissKeyboard}
            />

            {showError && (
              <Text className="text-error500 font-sora text-center text-sm p-2">
                Please enter a valid email address
              </Text>
            )}

            <Text className="text-neutral200 font-sora text-xs mt-4 text-center">
              We'll send a verification code to this email address
            </Text>
          </View>

          {/* Footer - Conditionally positioned based on keyboard visibility */}
          <View className={`${isKeyboardVisible ? 'mb-4' : 'pb-16'}`}>
            <Button
              text="Proceed"
              onPress={handleProceed}
              isDisabled={!isValid}
            />
          </View>
        </KeyboardAvoidingView>

        {/* Overlay to dismiss keyboard when tapping outside */}
        {isKeyboardVisible && (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-transparent" />
          </TouchableWithoutFeedback>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}