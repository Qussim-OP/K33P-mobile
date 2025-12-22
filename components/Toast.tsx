import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

interface ToastProps {
  message?: string;
  duration?: number;
  onHide?: () => void;
  visible: boolean;
}

export default function Toast({ 
  message = 'This feature is currently not available', 
  duration = 3000,
  onHide,
  visible 
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      // Show toast with animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(position, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Hide toast after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(position, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        opacity: opacity,
        transform: [{ translateY: position }],
      }}
      className="px-4 pb-8"
    >
      <View className="bg-gray-950 rounded-xl px-4 py-3">
        <Text className="text-neutral100 font-sora text-xs text-center">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}