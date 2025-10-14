import { BackIcon, Lock_3 } from '@/assets/images/svg';
import Button from '@/components/Button';
import NumericKeypad from '@/components/Keypad';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import CenterImage from '../../../../../assets/images/face-id.png';
import Icon2 from '../../../../../assets/images/FaceMask.png';
import Icon1 from '../../../../../assets/images/Sun.png';

export default function FaceScan() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showKeypad, setShowKeypad] = useState(false);
  const otpInputs = useRef<(TextInput | null)[]>([]);

  const handleKeyPress = (num: string) => {
    if (currentIndex < 5) {
      const newOtp = [...otp];
      newOtp[currentIndex] = num;
      setOtp(newOtp);
      
      if (currentIndex < 4) {
        setCurrentIndex(currentIndex + 1);
        otpInputs.current[currentIndex + 1]?.focus();
      }
    }
  };

  const handleBackspace = () => {
    if (currentIndex > 0 && otp[currentIndex] === '') {
      const newOtp = [...otp];
      newOtp[currentIndex - 1] = '';
      setOtp(newOtp);
      setCurrentIndex(currentIndex - 1);
      otpInputs.current[currentIndex - 1]?.focus();
    } else if (otp[currentIndex] !== '') {
      const newOtp = [...otp];
      newOtp[currentIndex] = '';
      setOtp(newOtp);
    }
  };

  const handleProceed = () => {
      router.push('/sign-up/biometrics/facesetup');
  };

  return (
    <TouchableWithoutFeedback onPress={() => setShowKeypad(false)}>
      <View className="flex-1 bg-neutral800 px-5 pt-12">
        {/* Header */}
        <View className="relative flex-row items-center justify-start mb-4">
          <TouchableOpacity className="z-10" onPress={() => router.back()}>
          <BackIcon width={40} height={40} />

</TouchableOpacity>
<Lock_3 
style={{
  position: 'absolute',
  left: '50%',
  transform: [{ translateX: '-50%' }]
}}
/>
        </View>

        {/* Centered Image */}
        <View className="items-center mb-8">
          <Image 
            source={CenterImage} 
            className="mt-16 " 
            resizeMode="contain" 
          />
        </View>

        {/* Icon-Text Pairs with proper text wrapping */}
        <View className="mb-8 px-2">
          {/* First Icon-Text Pair */}
          <View className="flex-row mb-6">
            <View className="mr-4 mt-1">
              <Image 
                source={Icon1} 
                className="w-6 h-6" 
                resizeMode="contain" 
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-sora text-sm flex-wrap" numberOfLines={3}>
                Enroll face in the day time or in a well-lighted environment
              </Text>
            </View>
          </View>

          {/* Second Icon-Text Pair */}
          <View className="flex-row">
            <View className="mr-4 mt-1">
              <Image 
                source={Icon2} 
                className="w-6 h-6" 
                resizeMode="contain" 
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-sora text-sm flex-wrap" numberOfLines={3}>
                Do not wear any object like mask or glasses that will cover the face
              </Text>
            </View>
          </View>
        </View>

        {/* Proceed Button at Bottom */}
        <View className="flex-1 justify-end pb-16">
          <Button
            text="Proceed"
            onPress={handleProceed}
          />
        </View>

        {/* Dismiss Keypad Overlay */}
        {showKeypad && (
          <TouchableWithoutFeedback onPress={() => setShowKeypad(false)}>
            <View className="absolute top-0 left-0 right-0 bottom-80 bg-transparent" />
          </TouchableWithoutFeedback>
        )}

        {/* Custom Numeric Keypad */}
        <NumericKeypad
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          isVisible={showKeypad}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}