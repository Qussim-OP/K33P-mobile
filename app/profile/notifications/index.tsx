import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import BackIcon from '../../../assets/images/back.png';

export default function Notifications() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-neutral800 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6 mt-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={BackIcon} className="w-10 h-10" resizeMode="contain" />
        </TouchableOpacity>
        <Text className="text-white font-sora-bold text-sm">Notifications</Text>
        <View className="w-10" />
      </View>

     
    </View>
  );
}