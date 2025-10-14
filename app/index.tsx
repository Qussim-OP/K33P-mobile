import Button from '@/components/Button';
import useCustomFonts from '@/hooks/useCustomFonts';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { K33PLogo } from '../assets/images/svg';
import './global.css';

export default function Index() {
  const router = useRouter();
  const { fontsLoaded, onLayoutRootView } = useCustomFonts();

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView className="flex-1 bg-black" onLayout={onLayoutRootView}>
      {/* Top Video Section */}
      <View className="w-full h-[300px] overflow-hidden">
         {/* <Video 
          ref={videoRef}
          source={require('../assets/animation/numbers.mp4')}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="cover"
          shouldPlay
          isLooping
          useNativeControls={false}
          style={{ width: '100%', height: '100%' }}
        />  */} 
      </View> 

      {/* Logo in the center */}
      <View className="absolute inset-0 justify-center items-center">
        <K33PLogo width={200} height={200} style={{ marginTop: 0 }} />
      </View>

      <View className="w-full absolute bottom-14 px-6 gap-y-4">
        <Button text="Login" onPress={() => router.push('/sign-in')} outline />
        <Button text="Create Account" onPress={() => router.push('/sign-up')} />
      </View>
    </SafeAreaView>
  );
}