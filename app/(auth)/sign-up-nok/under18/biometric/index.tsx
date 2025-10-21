import { BackIcon, Lock_3, PALM } from '@/assets/images/svg';
import Button from '@/components/Button';
import { useNokPhoneStore } from '@/store/useNokPhoneScreen';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function NokPhoneEntryScreen() {
  const router = useRouter();
  const [isValid, setIsValid] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  const { 
    nokPhoneNumber, 
    nokFormattedNumber,
    setNokPhoneNumber,
    setNokFormattedNumber
  } = useNokPhoneStore();
  

  const handleProceed = () => {
    console.log('Entered NOK phone number:', nokFormattedNumber);
    router.push('/(auth)/sign-up-nok/under18/biometric/capture');
  };


  return (
    <View className="flex-1 px-5">
      {/* Header */}
      <View className="relative flex-row items-center justify-start mb-12">
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

      {/* Content */}
    <View className="flex-1">
  <Text className="text-white text-sm font-sora text-center px-10 mb-8">
    This stage will capture your thumb. Please place your thumb in the highlighted area and capture after the vibration. Repeat 3 times
  </Text>

  <Text className="text-white text-2xl font-sora-semibold text-center mb-6">0%</Text>
  <PALM
    style={{
      left: '50%',
      transform: [{ translateX: '-50%' }],

    }}
  />
</View>

      {/* Footer */}
      <View className={`pb-16 `}>
        <Button
          text="Start Capture"
          onPress={handleProceed}
        />
      </View>

    </View>
  );
}