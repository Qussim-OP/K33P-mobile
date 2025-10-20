import { BackIcon, OVER18_2, OVER18_3 } from '@/assets/images/svg';
import Button from '@/components/Button';
import NumericKeypad from '@/components/Keypad';
import { usePinStore } from '@/store/usePinStore'; // Import the store
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export default function PinSetupScreen() {
  const router = useRouter();
  const setStoredPin = usePinStore((state) => state.setPin); // Get the setPin action
  const [step, setStep] = useState(1); // 1 = setup, 2 = confirm
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true); // Keypad should start visible

  const handleKeyPress = (num: string) => {
    if (currentIndex < 4) {
      if (step === 1) {
        const newPin = [...pin];
        newPin[currentIndex] = num;
        setPin(newPin);
        setCurrentIndex(currentIndex + 1);
      } else {
        const newConfirm = [...confirmPin];
        newConfirm[currentIndex] = num;
        setConfirmPin(newConfirm);
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handleBackspace = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    if (step === 1) {
      const newPin = [...pin];
      newPin[currentIndex - 1] = ''; // Fix: target previous index for backspace
      setPin(newPin);
    } else {
      const newConfirm = [...confirmPin];
      newConfirm[currentIndex - 1] = ''; // Fix: target previous index for backspace
      setConfirmPin(newConfirm);
    }
  };

  useEffect(() => {
    // Logic for PIN completion and validation
    const currentPinArray = step === 1 ? pin : confirmPin;
    const isComplete = currentPinArray.every((d) => d !== '');

    if (isComplete) {
      if (step === 1) {
        // Automatically move to confirm step once setup PIN is complete
        setTimeout(() => {
          setStep(2);
          setConfirmPin(['', '', '', '']); // Reset confirm pin
          setCurrentIndex(0); // Reset index for next step
        }, 300); // Small delay for visual feedback
      } else if (step === 2) {
        const match = pin.join('') === confirmPin.join('');
        setIsValid(match);
        setIsError(!match);

        if (!match) {
          setTimeout(() => {
            setPin(['', '', '', '']); // Reset both
            setConfirmPin(['', '', '', '']);
            setCurrentIndex(0);
            setIsError(false);
            setStep(1); // Go back to setup
          }, 1500); // Show error for a moment
        }
      }
    } else {
        // If not complete, ensure isValid and isError are reset
        setIsValid(false);
        setIsError(false);
    }
  }, [pin, confirmPin, step]); // Depend on pin, confirmPin, and step

  const handleProceed = () => {
    if (step === 2 && isValid) {
      setStoredPin(pin.join('')); // Save PIN to Zustand store
      router.push('/(auth)/sign-up-nok/over18/upload'); // Navigate to next screen
    }
  };

  const focusPinCircle = (index: number) => {
    setCurrentIndex(index);
    setShowKeypad(true);
  };

  const getSubtext = () => {
    if (step === 1) return 'Setup your 4-digit PIN';
    if (step === 2 && isValid) return 'PIN matched successfully!';
    if (step === 2 && isError) return 'The PIN you entered is incorrect. Please try again.';
    return 'Confirm your 4-digit PIN';
  };

  return (
    <TouchableWithoutFeedback onPress={() => setShowKeypad(false)}>
      <View className="flex-1  px-5">
        {/* Header */}
        <View className="relative flex-row items-center justify-start mb-12">
        <TouchableOpacity className="z-10" onPress={() => router.back()}>
          <BackIcon width={40} height={40} />

        </TouchableOpacity>
        {isValid ? (
  <OVER18_3 
    style={{
      position: 'absolute',
      left: '50%',
      transform: [{ translateX: '-50%' }]
    }}
  />
) : (
  <OVER18_2 
    style={{
      position: 'absolute',
      left: '50%',
      transform: [{ translateX: '-50%' }]
    }}
  />
)}
    
      </View>


        {/* Content */}
        <View className="flex-1">
          <Text className="text-white font-sora-bold text-sm text-center mb-1">
            {step === 1 ? 'Setup NOK PIN' : 'Confirm PIN'}
          </Text>
          <Text className="text-sm font-sora text-center mb-6 px-8 py-2 text-neutral200">
            {getSubtext()}
          </Text>

          {/* PIN Circles */}
          <View className="flex-row justify-center mb-2">
            {(step === 1 ? pin : confirmPin).map((digit, index) => {
              const filled = digit !== '';
              const matched = isValid && step === 2;

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={1}
                  onPress={() => focusPinCircle(index)}
                  className={`w-6 h-6 mx-3 rounded-full border items-center justify-center ${
                    isError && step === 2
                      ? 'border-error500'
                      : matched
                      ? 'bg-success500 border-success500'
                      : filled
                      ? 'bg-neutral200 border-neutral200'
                      : 'border-neutral200'
                  }`}
                />
              );
            })}
          </View>

          {/* Error Message */}
          {isError && step === 2 && (
            <Text className="text-error500 text-center text-sm  mt-3">
              The PIN you entered is incorrect. Please try again
            </Text>
          )}
        </View>

        {/* Confirm / Continue Button */}
        <View className={`pb-16 ${showKeypad ? 'mb-80' : ''}`}>
          <Button
            text={step === 1 ? 'Confirm' : isValid ? 'Continue' : 'Confirm'}
            onPress={handleProceed}
            isDisabled={
              (step === 1 && pin.some((d) => d === '')) || // Disable if setup pin not complete
              (step === 2 && !isValid) // Disable if confirm pin not valid
            }
          />
        </View>

        {/* Dismiss Keypad Area (Covers area above keypad) */}
        {showKeypad && (
          <TouchableWithoutFeedback onPress={() => setShowKeypad(false)}>
            <View className="absolute top-0 left-0 right-0 bottom-80 bg-transparent" />
          </TouchableWithoutFeedback>
        )}

        {/* Custom Keypad */}
        <NumericKeypad
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          isVisible={showKeypad}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}