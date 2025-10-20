import Button from '@/components/Button';
import useCustomFonts from '@/hooks/useCustomFonts';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { K33PLogo } from '../assets/images/svg';
import './global.css';

export default function Index() {
  const router = useRouter();
  const { fontsLoaded, onLayoutRootView } = useCustomFonts();

  // Animation values
  const logoPosition = useRef(new Animated.Value(0)).current;
  const buttonsPosition = useRef(new Animated.Value(100)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimations = async () => {
      // Wait 2 seconds before starting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Move logo up (but not too much)
      Animated.parallel([
        Animated.timing(logoPosition, {
          toValue: -40, 
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsPosition, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    };

    startAnimations();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View className="flex-1 bg-black" onLayout={onLayoutRootView}>
      {/* Top Video Section */}
      <View className="h-[50%] w-full mt-[-100px]  overflow-hidden">
       <Video 
          source={require('../assets/animation/numbers.mp4')}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="contain"
          shouldPlay
          isLooping
          useNativeControls={false}
          style={{ width: '100%', height: '100%' }}
        />  
      </View> 

      {/* Animated Logo - Positioned lower initially */}
      <Animated.View 
        className="absolute"
        style={{
          top: '50%', // Changed from 50% to 60% to start lower
          left: '50%',
          transform: [
            { translateX: -100 }, 
            { translateY: -100 },
            { translateY: logoPosition },
          ]
        }}
      >
        <K33PLogo width={200} height={200} />
      </Animated.View>

      {/* Animated Buttons */}
      <Animated.View 
        className="w-full absolute px-6 gap-y-4"
        style={{
          bottom: 60,
          transform: [{ translateY: buttonsPosition }],
          opacity: buttonsOpacity,
        }}
      >
        <Button text="Login" onPress={() => router.push('/sign-in')} outline />
        <Button text="Create Account" onPress={() => router.push('/sign-up')} />
      </Animated.View>
    </View>
  );
}