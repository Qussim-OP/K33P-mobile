// screens/EditProfile.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import {
  BackIcon,
  P_ONE as Lock1,
  P_TWO as Lock2,
  P_THREE as Lock3,
  P_ONE,
  P_ONE_SELECTED,
  P_THREE,
  P_THREE_SELECTED,
  P_TWO,
  P_TWO_SELECTED
} from '@/assets/images/svg';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/useAuthMethod';
import { checkUsernameAvailability, getUsername, updateUsername } from '@/utils/api';
import {
  getCurrentImageNumber,
  updateImageNumber,
  validateImageNumber
} from '@/utils/image-number-api';

export default function EditProfile() {
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [initialAvatar, setInitialAvatar] = useState(1);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [isUsernameChanged, setIsUsernameChanged] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialUsername, setInitialUsername] = useState('');
  const [apiUsername, setApiUsername] = useState('');
  const [localUsername, setLocalUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [usernameValidationError, setUsernameValidationError] = useState<string | null>(null);
  
  const { username, setUsername, token } = useAuthStore();
  const buttonPosition = useRef(new Animated.Value(44)).current; // Start at 16px from bottom
  const textInputRef = useRef<TextInput>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Avatar images mapping
  const avatars = [
    { 
      id: 1, 
      selectedImage: P_ONE_SELECTED, 
      image: P_ONE,
      lockImage: Lock1
    },
    { 
      id: 2, 
      selectedImage: P_TWO_SELECTED, 
      image: P_TWO,
      lockImage: Lock2
    },
    { 
      id: 3, 
      selectedImage: P_THREE_SELECTED, 
      image: P_THREE,
      lockImage: Lock3
    }
  ];

  // Fetch current image number and username from API on mount
  useEffect(() => {
    const fetchData = async () => {
      await fetchCurrentImageNumber();
      await fetchUsernameFromAPI();
    };
    
    fetchData();
    
    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      handleKeyboardShow
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      handleKeyboardHide
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      // Clear timeout on unmount
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Check if changes were made
  useEffect(() => {
    setIsImageChanged(selectedAvatar !== initialAvatar);
    setIsUsernameChanged(localUsername !== initialUsername);
  }, [selectedAvatar, localUsername, initialAvatar, initialUsername]);

  // Check username availability when username changes
  useEffect(() => {
    const checkUsername = async () => {
      // Clear previous timeout
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      // Reset availability state
      setUsernameAvailable(null);
      setUsernameValidationError(null);

      // If username hasn't changed or is empty, don't check
      if (!isUsernameChanged || !localUsername.trim()) {
        return;
      }

      // Validate username format first
      if (localUsername.length < 3 || localUsername.length > 30) {
        setUsernameValidationError('Username must be between 3 and 30 characters');
        setUsernameAvailable(false);
        return;
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(localUsername)) {
        setUsernameValidationError('Username can only contain letters, numbers, and underscores');
        setUsernameAvailable(false);
        return;
      }

      // If username is same as current, it's available
      if (localUsername === initialUsername) {
        setUsernameAvailable(true);
        return;
      }

      // Debounce the API call
      checkTimeoutRef.current = setTimeout(async () => {
        try {
          setCheckingAvailability(true);
          const isAvailable = await checkUsernameAvailability(localUsername.trim());
          setUsernameAvailable(isAvailable);
          
          if (!isAvailable) {
            setUsernameValidationError('This username is already taken');
          }
        } catch (error) {
          console.error('Error checking username availability:', error);
          setUsernameAvailable(false);
          setUsernameValidationError('Unable to check username availability');
        } finally {
          setCheckingAvailability(false);
        }
      }, 500); // 500ms debounce
    };

    checkUsername();

    // Cleanup function
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [localUsername, isUsernameChanged, initialUsername]);

  const fetchCurrentImageNumber = async () => {
    if (!token) return;
    
    try {
      const response = await getCurrentImageNumber();
      
      if (response.success && response.data) {
        const currentImageNumber = response.data.imageNumber;
        setSelectedAvatar(currentImageNumber);
        setInitialAvatar(currentImageNumber);
      } else {
        console.log('Failed to fetch image number:', response.message);
      }
    } catch (error) {
      console.error('Error fetching image number:', error);
    }
  };

  const fetchUsernameFromAPI = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const userData = await getUsername();
      
      if (userData && userData.username) {
        // Set both API username and local username state
        setApiUsername(userData.username);
        setLocalUsername(userData.username);
        setInitialUsername(userData.username);
        // Also update store
        setUsername(userData.username);
      } else if (userData && !userData.username) {
        console.log('User exists but no username set in API');
        // User exists but no username is set yet
        setApiUsername('');
        setLocalUsername('');
        setInitialUsername('');
      } else {
        console.log('Failed to fetch username from API');
      }
    } catch (error) {
      console.error('Error fetching username from API:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyboardShow = (event: any) => {
    const keyboardHeight = event.endCoordinates.height;
    setKeyboardVisible(true);
    setKeyboardHeight(keyboardHeight);
    
    // Move button up to be 16px above keyboard
    // Button at bottom:16, need to move up by (keyboardHeight - 16)
    Animated.timing(buttonPosition, {
      duration: event.duration || 250,
      toValue: -(keyboardHeight - 80),
      useNativeDriver: true,
    }).start();
  };
  
  const handleKeyboardHide = (event: any) => {
    setKeyboardVisible(false);
    
    Animated.timing(buttonPosition, {
      duration: event.duration || 250,
      toValue: 44,
      useNativeDriver: true,
    }).start();
  };


  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleAvatarSelect = (avatarId: number) => {
    setSelectedAvatar(avatarId);
    dismissKeyboard();
  };

  const handleUsernameChange = (text: string) => {
    setLocalUsername(text);
  };

  const handleSave = async () => {
    // Validate image number
    const imageValidation = validateImageNumber(selectedAvatar);
    if (!imageValidation.valid) {
      Alert.alert('Invalid Image', imageValidation.message || 'Please select a valid avatar');
      return;
    }

    // If no changes were made, just go back
    if (!isImageChanged && !isUsernameChanged) {
      router.back();
      return;
    }

    // Check username availability one more time before saving
    if (isUsernameChanged && localUsername.trim()) {
      if (usernameAvailable === false) {
        Alert.alert('Username Taken', 'This username is already taken. Please choose a different one.');
        return;
      }
      
      if (usernameAvailable === null) {
        Alert.alert('Checking Username', 'Please wait while we check username availability.');
        return;
      }
    }

    try {
      setSaving(true);
      
      // Update username via API if changed
      if (isUsernameChanged && localUsername.trim()) {
        try {
          const updateResponse = await updateUsername(localUsername.trim());
          
          if (!updateResponse) {
            throw new Error('Failed to update username');
          }
          
          console.log('Username updated successfully via API:', updateResponse.username);
          
          // Update store with new username
          setUsername(localUsername.trim());
          setApiUsername(localUsername.trim());
          setInitialUsername(localUsername.trim());
          
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to update username');
          setSaving(false);
          return;
        }
      }
      
      // Update image via API if changed
      if (isImageChanged) {
        const imageResponse = await updateImageNumber(selectedAvatar);
        
        if (!imageResponse.success) {
          Alert.alert('Error', imageResponse.message || 'Failed to update avatar');
          setSaving(false);
          return;
        }
        
        // Update local state
        setInitialAvatar(selectedAvatar);
      }
      
      // Show success message
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getButtonText = () => {
    if (saving) return 'Saving...';
    return 'Apply & Save';
  };

  const isSaveDisabled = () => {
    // Disable if saving
    if (saving) return true;
    
    // Disable if no changes
    if (!isImageChanged && !isUsernameChanged) return true;
    
    // Disable if username is changed but not available
    if (isUsernameChanged && localUsername.trim()) {
      if (usernameAvailable === false) return true;
      if (usernameAvailable === null) return true;
      if (checkingAvailability) return true;
      if (usernameValidationError) return true;
    }
    
    return false;
  };

  // Show loading screen while fetching profile data
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-white font-sora text-base">Loading profile...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingBottom: keyboardVisible ? keyboardHeight + 60 : 100 // Add extra padding when keyboard is visible
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <View className="flex-1 px-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-10">
              <TouchableOpacity onPress={() => {
                dismissKeyboard();
                router.back();
              }}>
                <BackIcon />
              </TouchableOpacity>
              <Text className="text-white font-sora-bold text-sm">Edit Profile</Text>
              <View className="w-10" />
            </View>

            {/* Avatar Selection */}
            <Text className="text-neutral100 font-sora text-sm mb-6">Choose Avatar</Text>
            <View className="flex-row justify-between mb-8">
              {avatars.map((avatar) => (
                <TouchableOpacity 
                  key={avatar.id}
                  onPress={() => handleAvatarSelect(avatar.id)}
                  className={`relative rounded-full p-7 ${
                    selectedAvatar === avatar.id 
                      && 'bg-[#484848]' 
                  }`}
                  activeOpacity={0.7}
                >
                  {selectedAvatar === avatar.id ? (
                    <avatar.selectedImage 
                      width={35}
                      height={35}
                    />
                  ) : (
                    <avatar.image 
                      width={35}
                      height={35}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Username Input */}
            <Text className="text-white font-sora text-sm mb-4">What would you want to be called?</Text>
            <TextInput
              ref={textInputRef}
              className={`rounded-lg px-5 py-3 mb-2 border font-sora text-sm text-white ${
                usernameValidationError 
                  ? 'border-red-500' 
                  : usernameAvailable === false 
                    ? 'border-red-500' 
                    : usernameAvailable === true 
                      ? 'border-green-500' 
                      : 'border-neutral200'
              }`}
              placeholder="Enter your name"
              placeholderTextColor="#FFFFFF"
              value={localUsername}
              onChangeText={handleUsernameChange}
              onSubmitEditing={dismissKeyboard}
              returnKeyType="done"
              blurOnSubmit={true}
              onFocus={() => setKeyboardVisible(true)}
              onBlur={() => setKeyboardVisible(false)}
            />
            
            {/* Username status messages */}
            <View className="mb-2 min-h-6">
              {checkingAvailability && (
                <Text className="text-neutral200 font-sora text-xs">
                  Checking username availability...
                </Text>
              )}
              
              {!checkingAvailability && usernameValidationError && (
                <Text className="text-red-500 font-sora text-xs">
                  {usernameValidationError}
                </Text>
              )}
              
              {!checkingAvailability && usernameAvailable === true && (
                <Text className="text-green-500 font-sora text-xs">
                  ✓ Username is available
                </Text>
              )}
              
              {!checkingAvailability && usernameAvailable === false && localUsername.trim() && localUsername !== initialUsername && (
                <Text className="text-red-500 font-sora text-xs">
                  ✗ This username is already taken
                </Text>
              )}
              
              {!checkingAvailability && !usernameValidationError && !localUsername.trim() && !apiUsername && (
                <Text className="text-neutral200 font-sora text-xs">
                  Add a username to personalize your profile
                </Text>
              )}
            </View>

            {/* Spacer to push button up when keyboard is visible */}
            <View className="flex-1 min-h-20" />
          </View>
        </ScrollView>

        {/* Save Button - Animated to stay above keyboard */}
        <Animated.View 
          style={[
            {
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 100, // Start at bottom
              transform: [{ translateY: buttonPosition }],
            }
          ]}
        >
          <Button 
            text={getButtonText()}
            onPress={handleSave}
            isDisabled={isSaveDisabled()}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}