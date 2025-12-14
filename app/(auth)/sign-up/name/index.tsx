// Updated NameScreen component
import { BackIcon } from '@/assets/images/svg';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/useAuthMethod';
import { checkUsernameAvailability, setupUsername } from '@/utils/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export default function NameScreen() {
  const router = useRouter();
  const [inputName, setInputName] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const buttonOffset = useRef(new Animated.Value(0)).current;
  
  // Get auth store functions
  const setUsername = useAuthStore((state) => state.setUsername);
  const setToken = useAuthStore((state) => state.setToken);

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

  // Check username availability when input changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (isValid) {
        setIsChecking(true);
        setAvailabilityMessage('');
        
        try {
          const available = await checkUsernameAvailability(inputName);
          setIsAvailable(available);
          
          if (available) {
            setAvailabilityMessage('Username is available!');
          } else {
            setAvailabilityMessage('Username is already taken');
          }
        } catch (error) {
          setAvailabilityMessage('Error checking username availability');
          setIsAvailable(false);
        } finally {
          setIsChecking(false);
        }
      } else {
        setIsAvailable(false);
        setAvailabilityMessage('');
      }
    };

    const debounceTimer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(debounceTimer);
  }, [inputName, isValid]);

  const handleNameChange = (text: string) => {
    const cleanedText = text.trim();
    setInputName(cleanedText);
    setIsValid(cleanedText.length >= 3);
    setIsTouched(true);
  };

  const handleProceed = async () => {
    if (isValid && isAvailable) {
      setIsSettingUp(true);
      
      try {
        const success = await setupUsername(inputName);
        
        if (success) {
          // Username is already saved to store in setupUsername function
          console.log('Username setup completed successfully');
          router.push('/(home)');
        } else {
          setAvailabilityMessage('Failed to setup username. Please try again.');
        }
      } catch (error) {
        console.log('Username setup error:', error);
        setAvailabilityMessage('Error setting up username');
      } finally {
        setIsSettingUp(false);
      }
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const showError = isTouched && !isValid && inputName.length > 0;
  const canProceed = isValid && isAvailable && !isSettingUp;

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          className="flex-1"
        >
          <View className="flex-1 px-5">
            {/* Header */}
            <View className="relative flex-row items-center justify-start mb-12">
              <TouchableOpacity className="z-10" onPress={() => router.back()}>
                <BackIcon width={40} height={40} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="flex-1">
              <Text className="text-white font-sora text-sm mb-4">
                What would you like to be Called
              </Text>

              <TextInput
                className={`rounded-lg px-5 py-3 mb-2 ${
                  showError ? 'border-error500' : 
                  availabilityMessage && !isAvailable ? 'border-error500' : 
                  availabilityMessage && isAvailable ? 'border-green-500' : 
                  'border-neutral200'
                } font-sora text-sm text-white border`}
                placeholder="Enter a Username"
                placeholderTextColor="#969696"
                value={inputName}
                onChangeText={handleNameChange}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                returnKeyType="done"
                onSubmitEditing={handleProceed}
                editable={!isSettingUp}
              />

              <View className="min-h-8">
                {showError && (
                  <Text className="text-error500 font-sora text-sm p-2">
                    Username must be at least 3 characters
                  </Text>
                )}
                
                {isChecking && (
                  <View className="flex-row items-center p-2">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white font-sora text-sm ml-2">
                      Checking availability...
                    </Text>
                  </View>
                )}
                
                {availabilityMessage && !isChecking && (
                  <Text className={`font-sora text-sm p-2 ${
                    isAvailable ? 'text-green-500' : 'text-error500'
                  }`}>
                    {availabilityMessage}
                  </Text>
                )}
              </View>
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
            bottom: 16,
            left: 0,
            right: 0,
          }}
        >
          <Button
            text={isSettingUp ? "Setting Up..." : "Proceed"}
            onPress={handleProceed}
            isDisabled={!canProceed}
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}