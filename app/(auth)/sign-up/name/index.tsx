import Button from '@/components/Button';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import BackButton from '../../../../assets/images/back.png';

export default function NameScreen() {
  const router = useRouter();
  const [inputName, setInputName] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const buttonOffset = useRef(new Animated.Value(0)).current;
  
  // Get the setName function from our store
  const setName = useUserStore((state) => state.setName);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        Animated.timing(buttonOffset, {
          duration: event.duration || 250,
          toValue: -event.endCoordinates.height,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        Animated.timing(buttonOffset, {
          duration: event.duration || 250,
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleNameChange = (text: string) => {
    setInputName(text);
    setIsValid(text.length >= 3);
    setIsTouched(true);
  };

  const handleProceed = () => {
    if (isValid) {
      // Save the name to our Zustand store
      setName(inputName);
      console.log('Saved name:', inputName);
      router.push('/(home)');
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const showError = isTouched && !isValid && inputName.length > 0;

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className="flex-1 bg-neutral800">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          className="flex-1"
        >
          <View className="flex-1 px-5 pt-12">
            {/* Header */}
            <View className="relative flex-row items-center justify-start mb-12">
              <TouchableOpacity className="z-10" onPress={() => router.back()}>
                <Image source={BackButton} className="w-10 h-10" resizeMode="contain" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="flex-1">
              <Text className="text-white font-sora text-sm mb-4">
                What would you like to be Called
              </Text>

              <TextInput
                className={`rounded-lg px-5 py-3 mb-2 ${
                  showError ? 'border-error500' : 'border-neutral200'
                } font-sora text-sm text-white border`}
                placeholder="Enter a Name or Nick-name"
                placeholderTextColor="#969696"
                value={inputName}
                onChangeText={handleNameChange}
                maxLength={30}
                autoCapitalize="words"
                autoCorrect={false}
                keyboardType="default"
                returnKeyType="done"
                onSubmitEditing={handleProceed}
              />

              {showError && (
                <Text className="text-error500 font-sora text-sm p-2">
                  Name must be at least 3 characters
                </Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Footer - Animated to move with keyboard */}
        <Animated.View 
          style={{ 
            transform: [{ translateY: buttonOffset }],
            paddingHorizontal: 20,
            paddingBottom: 16,
            paddingTop: 16,
            backgroundColor: 'transparent',
            position: 'absolute',
            bottom: 10,
            left: 0,
            right: 0,
          }}
        >
          <Button
            text="Proceed"
            onPress={handleProceed}
            isDisabled={!isValid}
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}