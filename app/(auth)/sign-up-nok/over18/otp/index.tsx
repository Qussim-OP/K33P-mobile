import { BackIcon, OVER18_0, OVER18_1 } from '@/assets/images/svg';
import Button from '@/components/Button';
import NumericKeypad from '@/components/Keypad';
import { usePhoneStore } from '@/store/usePhoneStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function OTPEntryScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const otpInputs = useRef<(TextInput | null)[]>([]);

  const { formattedNumber } = usePhoneStore();

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Check OTP validity
  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === 5) {
      if (otpString === '00000') {
        setIsValid(true);
        setIsError(false);
      } else {
        setIsValid(false);
        setIsError(true);
      }
    } else {
      setIsValid(false);
      setIsError(false);
    }
  }, [otp]);

  const handleKeyPress = (num: string) => {
    if (currentIndex < 5) {
      const newOtp = [...otp];
      newOtp[currentIndex] = num;
      setOtp(newOtp);
      
      if (currentIndex < 4) {
        setCurrentIndex(currentIndex + 1);
        otpInputs.current[currentIndex + 1]?.focus();
      }
    }
  };

  const handleBackspace = () => {
    if (currentIndex > 0 && otp[currentIndex] === '') {
      const newOtp = [...otp];
      newOtp[currentIndex - 1] = '';
      setOtp(newOtp);
      setCurrentIndex(currentIndex - 1);
      otpInputs.current[currentIndex - 1]?.focus();
    } else if (otp[currentIndex] !== '') {
      const newOtp = [...otp];
      newOtp[currentIndex] = '';
      setOtp(newOtp);
    }
  };

  const handleResend = () => {
    setTimer(120);
    setIsResendDisabled(true);
    // Add your resend OTP logic here
  };

  const handleProceed = () => {
    if (isValid) {
      router.push('/sign-up-nok/over18/email');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <TouchableWithoutFeedback onPress={() => setShowKeypad(false)}>
      <View className="flex-1 px-5">
        {/* Header */}
        <View className="relative flex-row items-center justify-start mb-12">
        <TouchableOpacity className="z-10" onPress={() => router.back()}>
          <BackIcon width={40} height={40} />

        </TouchableOpacity>
        {isValid ? (
  <OVER18_1 
    style={{
      position: 'absolute',
      left: '50%',
      transform: [{ translateX: '-50%' }]
    }}
  />
) : (
  <OVER18_0 
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
          <Text className="text-white font-sora-bold text-sm text-center">
            Enter OTP
          </Text>
          <Text className="text-neutral200 font-sora text-sm text-center mb-8 px-8 py-2">
            A 5-digit OTP has been sent to {formattedNumber}
          </Text>

          {/* OTP Boxes */}
          <View className="flex-row justify-center mb-8">
            {otp.map((digit, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={1}
                onPress={() => {
                  setCurrentIndex(index);
                  setShowKeypad(true);
                  otpInputs.current[index]?.focus();
                }}
              >
                <TextInput
                  ref={ref => (otpInputs.current[index] = ref)}
                  className={`w-11 h-11 mx-2 rounded-lg text-center font-sora-bold text-sm border ${
                    isError 
                      ? 'border-error500 text-error500 bg-[#FCC5C1]'
                      : isValid 
                        ? 'text-success500 border-neutral200'
                        : digit 
                          ? 'border-white text-white'
                          : 'border-neutral200 text-neutral200'
                  }`}
                  value={digit}
                  onChangeText={() => {}}
                  keyboardType="numeric"
                  maxLength={1}
                  showSoftInputOnFocus={false}
                  onFocus={() => {
                    setCurrentIndex(index);
                    setShowKeypad(true);
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>

          {isError && (
            <Text className="text-error500 font-sora text-center text-sm mb-4">
              Incorrect OTP. Please try again.
            </Text>
          )}
        </View>

        {/* Resend OTP and Proceed Button */}
        <View className={`pb-16 ${showKeypad ? 'mb-80' : ''}`}>
          <TouchableOpacity 
            className="mb-4 items-center"
            onPress={handleResend}
            disabled={isResendDisabled}
          >
            <Text 
              className={`font-sora text-sm ${
                isResendDisabled ? 'text-neutral100' : 'text-white'
              }`}
            >
              Resend OTP {isResendDisabled && `in ${formatTime(timer)}`}
            </Text>
          </TouchableOpacity>
          
          <Button
            text="Proceed"
            onPress={handleProceed}
            isDisabled={!isValid}
          />
        </View>

        {/* Dismiss Keypad Overlay */}
        {showKeypad && (
          <TouchableWithoutFeedback onPress={() => setShowKeypad(false)}>
            <View className="absolute top-0 left-0 right-0 bottom-80 bg-transparent" />
          </TouchableWithoutFeedback>
        )}

        {/* Custom Numeric Keypad */}
        <NumericKeypad
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          isVisible={showKeypad}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}