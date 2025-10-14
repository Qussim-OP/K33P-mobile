import { Video } from 'expo-av';
import React from 'react';
import { Text, TouchableOpacity, Vibration } from 'react-native';

type ButtonProps = {
  text: string;
  onPress: () => void;
  isDisabled?: boolean;
  outline?: boolean;
  danger?: boolean;
  isLoading?: boolean;
};

export default function Button({
  text,
  onPress,
  isDisabled = false,
  outline = false,
  danger = false,
  isLoading = false,
}: ButtonProps) {
  // Base classes
  let buttonClasses = 'py-3 rounded-xl w-full items-center justify-center h-12';
  let textClasses = 'font-sora-semibold text-sm text-center';

  if (isDisabled) {
    buttonClasses += ' bg-neutral300';
    textClasses += ' text-neutral50';
  } else if (danger) {
    buttonClasses += ' border border-error500/40 bg-transparent';
    textClasses += ' text-error500';
  } else if (outline) {
    buttonClasses += ' border border-main bg-transparent';
    textClasses += ' text-main';
  } else {
    buttonClasses += ' bg-main';
    textClasses += ' text-neutral800';
  }

  const handlePress = () => {
    // Trigger a short vibration (50ms) when button is pressed
    Vibration.vibrate(50);
    onPress();
  };

  return (
    <TouchableOpacity
      className={buttonClasses}
      onPress={handlePress}
      disabled={isDisabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        outline ? (
          <Text className={textClasses}>Please wait...</Text>
        ) : (
          <Video
            source={require('../assets/animation/loader.mp4')}
            rate={1.0}
            volume={1.0}
            isMuted={true}
            resizeMode="contain"
            shouldPlay={isLoading}
            isLooping
            style={{ width: 30, height: 24 }}
          />
        )
      ) : (
        <Text className={textClasses}>{text}</Text>
      )}
    </TouchableOpacity>
  );
}