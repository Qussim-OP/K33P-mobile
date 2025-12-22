import { BackIcon } from '@/assets/images/svg';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function ComingSoon() {
    const router = useRouter();

  return (
    <View className="flex-1 px-4 bg-[#181818] pt-6">
       <View className="absolute top-0 left-0 right-0 bottom-0 bg-[#181818]" />
      {/* Header */}
      <View className="flex-row items-center justify-between mb-10 ">
        <TouchableOpacity onPress={() => router.back()} className="">
          <BackIcon
            style={{
              left: '50%',
              transform: [{ translateX: '-50%' }],
            }}
          />
        </TouchableOpacity>

        <Text className="text-white font-sora-bold text-sm">Payment</Text>
        <View className="w-10" />

          
      </View>
      <View className="items-center w-full justify-center">
  <View className="mt-52">
    <Video 
      source={require('../../assets/animation/hourglass.mp4')}
      rate={1.0}
      volume={1.0}
      shouldPlay
      isLooping
      useNativeControls={false}
      style={{ 
        width: 80, // Increased width
        height: 80, 
      }}
      resizeMode="cover"
    />
  </View>
  <Text className="text-white font-sora-bold text-sm text-center my-2 ">
    Coming Soon...
  </Text>

            <Text className="text-neutral100 font-sora text-sm text-center mb-2">
            This service is still under construction and will be released in the beta version.
            </Text>
            
          </View>
      </View>

  )
}

