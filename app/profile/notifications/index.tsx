import { BackIcon } from '@/assets/images/svg';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Text,
  TouchableOpacity,
  View
} from 'react-native';


export default function Notifications() {
  const router = useRouter();

  return (
    <View className="flex-1 px-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6 ">
        <TouchableOpacity onPress={() => router.back()}>
        <BackIcon />
        </TouchableOpacity>
        <Text className="text-white font-sora-bold text-sm">Notifications</Text>
        <View className="w-10" />
      </View>

     
    </View>
  );
}