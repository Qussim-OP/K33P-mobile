import { useRouter } from 'expo-router';
import React from 'react';
import {
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { BackIcon, NOK_LOCK } from '@/assets/images/svg';

export default function Bank() {
  const router = useRouter();


  const handleNavigate = () => {
    router.push('/profile/manage-subscription');
  };

  return (
    <View className="flex-1 px-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
        <BackIcon
            style={{
              left: '50%',
              transform: [{ translateX: '-50%' }],
            }}
          />
        </TouchableOpacity>
        <Text className="text-white font-sora-bold text-sm">NOK Setup</Text>
        <View className="w-10" />
      </View>

      {/* Centered Content */}
      <View className="flex-1 justify-center items-center gap-5">
        {/* Centered Image */}
        <NOK_LOCK 
        style={{
        }}
        />
        {/* Centered Text */}
        <View className="items-center mb-">
          <Text className="text-white font-sora-semibold text-sm mb-2">Upgrade</Text>
          <Text className="text-neutral100 font-sora text-sm text-center px-8">
          This service is only for premium users
          </Text>
        </View>

        {/* Setup Button */}
        <TouchableOpacity 
          onPress={handleNavigate}
          className="mt-4"
        >
          <Text className="text-main font-sora-bold text-sm">Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>

     
    </View>
  );
}