import { BackIcon } from '@/assets/images/svg';
import Button from '@/components/Button';
import NumericKeypad from '@/components/Keypad';
import { useAuthStore } from '@/store/useAuthMethod'; // Import auth store
import { usePinStore } from '@/store/usePinStore';
import { updatePin } from '@/utils/api';
import { encryptPinData } from '@/utils/pinEncryption'; // Import encryption utility
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
  const setStoredPin = usePinStore((state) => state.setPin);
  const { userId } = useAuthStore(); // Get userId from auth store
  
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [loading, setLoading] = useState(false);

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
      newPin[currentIndex - 1] = '';
      setPin(newPin);
    } else {
      const newConfirm = [...confirmPin];
      newConfirm[currentIndex - 1] = '';
      setConfirmPin(newConfirm);
    }
  };

  useEffect(() => {
    const currentPinArray = step === 1 ? pin : confirmPin;
    const isComplete = currentPinArray.every((d) => d !== '');

    if (isComplete) {
      if (step === 1) {
        setTimeout(() => {
          setStep(2);
          setConfirmPin(['', '', '', '']);
          setCurrentIndex(0);
        }, 300);
      } else if (step === 2) {
        const match = pin.join('') === confirmPin.join('');
        setIsValid(match);
        setIsError(!match);

        if (!match) {
          setTimeout(() => {
            setPin(['', '', '', '']);
            setConfirmPin(['', '', '', '']);
            setCurrentIndex(0);
            setIsError(false);
            setStep(1);
          }, 1500);
        }
      }
    } else {
        setIsValid(false);
        setIsError(false);
    }
  }, [pin, confirmPin, step]);

  const handleProceed = async () => {
    if (step === 2 && isValid && userId) {
      try {
        setLoading(true);
  
        const pinString = pin.join('');
        const encryptedPin = encryptPinData(pinString, userId);
  
        setStoredPin(encryptedPin);
  
        const resp = await updatePin(encryptedPin);
  
        if (resp.success) {
          console.log('PIN updated on backend:', resp.data);
          router.replace('/profile/manage-keeplock');
        } else {
          console.error('PIN update failed:', resp.error || resp.message);
        }
      } finally {
        setLoading(false);
      }
    } else if (!userId) {
      console.error('User ID not available for PIN encryption');
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
      <View className="flex-1 px-5">
        <View className="relative flex-row items-center justify-start mb-12">
          <TouchableOpacity className="z-10" onPress={() => router.back()}>
            <BackIcon width={40} height={40} />
          </TouchableOpacity>
        </View>

        <View className="flex-1">
          <Text className="text-white font-sora-bold text-sm text-center mb-1">
            {step === 1 ? 'Setup PIN' : 'Confirm PIN'}
          </Text>
          <Text className="text-sm font-sora text-center mb-6 px-8 py-2 text-neutral200">
            {getSubtext()}
          </Text>

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

          {isError && step === 2 && (
            <Text className="text-error500 text-center text-sm mt-3">
              The PIN you entered is incorrect. Please try again
            </Text>
          )}
        </View>

        <View className={`pb-16 ${showKeypad ? 'mb-72' : ''}`}>
          <Button
            text={step === 1 ? 'Confirm' : isValid ? 'Continue' : 'Confirm'}
            onPress={handleProceed}
            isDisabled={
              loading ||
              (step === 1 && pin.some((d) => d === '')) ||
              (step === 2 && !isValid) ||
              !userId 
            }
          />
        </View>

        {showKeypad && (
          <TouchableWithoutFeedback
            onPress={() => {
              setShowKeypad(false);
            }}
          >
            <View 
              className="absolute top-0 left-0 right-0"
              style={{ bottom: 400 }}
            />
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