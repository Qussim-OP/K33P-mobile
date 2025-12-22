// screens/notifications/detail.tsx
import { BackIcon } from '@/assets/images/svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function NotificationDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const notificationId = params.notificationId as string;
  const title = params.title as string;
  const message = params.message as string;
  const date = params.date as string;

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-8">
        <TouchableOpacity onPress={() => router.back()}>
          <BackIcon />
        </TouchableOpacity>

        <Text className="text-white font-sora-bold text-sm">
          Notification
        </Text>

        <View className="w-6" /> {/* Spacer for centering */}
      </View>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title (Centered) */}
        <View className='mx-4 p-4 bg-[#2c2c2c] rounded-lg'>
            <View className="mb-5">
            <Text className="text-white font-sora text-xs text-center">
                {title}
            </Text>
            </View>

            {/* Message Body */}
            <View className="mb-4">
            <Text className="text-neutral200 font-space-mono text-xs leading-relaxed">
                {message}
            </Text>
            </View>
        </View>

        {/* Date (Centered at bottom) */}
        <View className="px-4 mt-auto pb-16">
          <Text className="text-neutral200 font-sora text-xs text-center">
            {date}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}