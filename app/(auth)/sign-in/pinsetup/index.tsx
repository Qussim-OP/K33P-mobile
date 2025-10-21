import { BackIcon, SIGN_IN_1, SIGN_IN_2 } from '@/assets/images/svg';
import Button from '@/components/Button';
import NumericKeypad from '@/components/Keypad';
import { usePinStore } from '@/store/usePinStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function PinEntryScreen() {
  const router = useRouter();
  const { pin: storedPin, hasPin } = usePinStore();
  const [pin, setPin] = useState(['', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isError, setIsError] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(!hasPin);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleKeyPress = (num: string) => {
    if (currentIndex < 4) {
      const newPin = [...pin];
      newPin[currentIndex] = num;
      setPin(newPin);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBackspace = () => {
    if (currentIndex > 0) {
      const newPin = [...pin];
      newPin[currentIndex - 1] = '';
      setPin(newPin);
      setCurrentIndex(currentIndex - 1);
    }
    setIsError(false);
  };

  useEffect(() => {
    const enteredPinComplete = pin.every(d => d !== '');
    if (enteredPinComplete) {
      handleSubmit();
    }
  }, [pin]);

  const handleSubmit = () => {
    const enteredPin = pin.join('');
    if (isSettingUp) {
      if (pin.length === 4) {
        usePinStore.getState().setPin(enteredPin);
        router.push('/sign-in/fingerprint');
      }
    } else {
      if (enteredPin === storedPin) {
        setIsUnlocked(true);
        setTimeout(() => {
          router.push('/sign-in/fingerprint');
        }, 500);
      } else {
        setIsError(true);
        setTimeout(() => {
          setPin(['', '', '', '']);
          setCurrentIndex(0);
          setIsError(false);
        }, 1000);
      }
    }
  };

  const focusPinCircle = (index: number) => {
    setCurrentIndex(index);
    setShowKeypad(true);
  };

  return (
    <TouchableWithoutFeedback onPress={() => setShowKeypad(false)}>
      <View className="flex-1 px-5">
        <View className="relative flex-row items-center justify-start mb-12">
          <TouchableOpacity className="z-10" onPress={() => router.back()}>
            <BackIcon width={40} height={40} />
          </TouchableOpacity>
          {isUnlocked ? (
            <SIGN_IN_2
              style={{
                position: 'absolute',
                left: '50%',
                transform: [{ translateX: '-50%' }],
              }}
            />
          ) : (
            <SIGN_IN_1
              style={{
                position: 'absolute',
                left: '50%',
                transform: [{ translateX: '-50%' }],
              }}
            />
          )}
        </View>

        <View className="flex-1">
          <Text className="text-white font-sora-bold text-sm text-center mb-1">
            {isSettingUp ? 'Create your PIN' : 'Enter your PIN'}
          </Text>
          <Text className="text-sm font-sora text-center mb-6 px-8 py-2 text-neutral200">
            {isError
              ? 'Incorrect PIN, try again'
              : isSettingUp
              ? 'Create a 4-digit PIN'
              : 'Enter your 4-digit PIN'}
          </Text>

          <View className="flex-row justify-center mb-2">
            {pin.map((digit, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={1}
                onPress={() => focusPinCircle(index)}
                className={`w-6 h-6 mx-3 rounded-full border items-center justify-center ${
                  isUnlocked
                    ? 'bg-success500 border-green-500'
                    : isError
                    ? 'border-error500'
                    : digit !== ''
                    ? 'bg-neutral200 border-neutral200'
                    : 'border-neutral200'
                }`}
              />
            ))}
          </View>
        </View>

        <View className={`pb-16 ${showKeypad ? 'mb-72' : ''}`}>
          <Button
            text={isSettingUp ? 'Set PIN' : 'Continue'}
            onPress={handleSubmit}
            isDisabled={pin.some(d => d === '')}
          />
        </View>

        {showKeypad && (
          <TouchableWithoutFeedback onPress={() => setShowKeypad(false)}>
            <View className="absolute top-0 left-0 right-0 bottom-80 bg-transparent" />
          </TouchableWithoutFeedback>
        )}

        <NumericKeypad
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          isVisible={showKeypad}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}
