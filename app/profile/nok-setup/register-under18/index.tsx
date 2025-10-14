import { BackIcon, FINGERPRINT, NOK_0, PHONE, PIN } from '@/assets/images/svg';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function FaceScan() {
  const router = useRouter();

  const handleProceed = () => {
      router.push('/(auth)/sign-up-nok/under18');
  };

  return (
    <TouchableWithoutFeedback>
      <View className="flex-1 bg-neutral800 px-5 pt-12">
        {/* Header */}
        <View className="relative flex-row items-center justify-start mb-4">
          <TouchableOpacity className="z-10" onPress={() => router.back()}>
          <BackIcon width={40} height={40} />

        </TouchableOpacity>
        <NOK_0 
        style={{
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: '-50%' }]
        }}
        />
        </View>

        <View className="mb-8 px-2">
          <View className="items-center my-8">
              <Text className="text-white font-sora-bold text-sm mb-2" >
                What to expect
              </Text>
              <Text className="text-neutral100 font-sora text-sm text-center" numberOfLines={3}>
              These are steps required to complete this process. Please ensure you have access to all of these at the moment
                </Text>
            </View>

          <View className='mt-5 gap-5'>
            <View className="flex-row ">
                <View className="mr-4 ">
                <PHONE 
                  style={{
                  marginRight: 6
                  }}
                  />
                 
                </View>
              <View className="flex-1">
                <Text className="text-white font-sora text-sm" >
                Phone Number (OTP Confirmation)
                </Text>
              </View>
            </View>

            {/* Second Icon-Text Pair */}
            <View className="flex-row">
              <View className="mr-4">
              <PIN 
                  style={{
                  marginRight: 6
                  }}
                  />
              </View>
              <View className="flex-1">
                <Text className="text-white font-sora text-sm">
                PIN
                </Text>
              </View>
              
            </View>

            <View className="flex-row mb-2">
                <View className="mr-4">
                <FINGERPRINT 
                  style={{
                  marginRight: 6
                  }}
                  />
                </View>
              <View className="flex-1">
                <Text className="text-white font-sora text-sm" >
                Fingerprint Scan
                </Text>
              </View>
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

        
      </View>
    </TouchableWithoutFeedback>
  );
}