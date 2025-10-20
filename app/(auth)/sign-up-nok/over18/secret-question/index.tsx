import { BackIcon, OVER18_3, OVER18_4 } from '@/assets/images/svg';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export default function SecretQuestion() {
  const router = useRouter();
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Local state for inputs (no store)
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  // Check validity when inputs change
  useEffect(() => {
    const bothFilled = question.trim().length > 0 && answer.trim().length > 0;
    setIsValid(bothFilled);
  }, [question, answer]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleQuestionChange = (text: string) => {
    setQuestion(text);
    setIsTouched(true);
  };

  const handleAnswerChange = (text: string) => {
    setAnswer(text);
    setIsTouched(true);
  };

  const handleProceed = () => {
    console.log('Secret Question:', question);
    console.log('Secret Answer:', answer);
    // Show success modal instead of navigating directly
    setShowSuccessModal(true);
  };

  const handleModalProceed = () => {
    setShowSuccessModal(false);
    // Navigate to next screen after modal
    router.push('/profile/nok-setup');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsFocused(false);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 px-5"
        >
          {/* Header */}
          <View className="relative flex-row items-center justify-start mb-12">
            <TouchableOpacity className="z-10" onPress={() => router.back()}>
              <BackIcon width={40} height={40} />
            </TouchableOpacity>
            
            {/* Change header image when modal is shown */}
            {showSuccessModal ? (
              <OVER18_4 
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: [{ translateX: '-50%' }]
                }}
              />
            ) : (
              <OVER18_3 
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: [{ translateX: '-50%' }]
                }}
              />
            )}
          </View>

          {/* Content */}
          <View className="flex">
            <Text className="text-white font-sora-bold text-sm mb-2">
              Set a Secret Question
            </Text>
            <Text className="text-neutral200 font-sora text-sm mb-8">
              Choose a personal question only your Next-of-Kin would know the answer to
            </Text>
          </View>

          <View className="flex-1">
            {/* Question Input */}
            <Text className="text-white font-sora text-sm mb-4">
              Enter Question
            </Text>

            <TextInput
              className={`rounded-lg px-5 py-3 mb-6 ${
                isFocused ? 'border-white' : 'border-neutral200'
              } font-sora text-sm border-2 text-white bg-transparent`}
              placeholder="eg. What is the color of the sky?"
              placeholderTextColor="#969696"
              autoCapitalize="sentences"
              autoCorrect={true}
              value={question}
              onChangeText={handleQuestionChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              returnKeyType="next"
            />

            {/* Answer Input */}
            <Text className="text-white font-sora text-sm mb-4">
              Enter Answer
            </Text>

            <TextInput
              className={`rounded-lg px-5 py-3 mb-2 ${
                isFocused ? 'border-white' : 'border-neutral200'
              } font-sora text-sm border-2 text-white bg-transparent`}
              placeholder="Enter your answer here"
              placeholderTextColor="#969696"
              autoCapitalize="sentences"
              autoCorrect={true}
              value={answer}
              onChangeText={handleAnswerChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              returnKeyType="done"
              onSubmitEditing={dismissKeyboard}
            />
          </View>

          {/* Footer */}
          <View className={`${isKeyboardVisible ? 'mb-4' : 'pb-16'}`}>
            <Button
              text="Proceed"
              onPress={handleProceed}
              isDisabled={!isValid}
            />
          </View>
        </KeyboardAvoidingView>

        {/* Overlay to dismiss keyboard when tapping outside */}
        {isKeyboardVisible && (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-transparent" />
          </TouchableWithoutFeedback>
        )}

        {/* Success Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showSuccessModal}
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <Pressable 
            onPress={() => setShowSuccessModal(false)} 
            className="absolute inset-0 bg-black/60"
          />
          <View className="absolute bottom-0 w-full bg-mainBlack rounded-t-3xl" style={{ height: '80%' }}>
            {/* Top white line */}
            <View className="w-16 h-1 bg-white rounded-full self-center mt-4 mb-8" />
            
            {/* Modal Content */}
            <View className="flex-1 items-center justify-center px-6">
              {/* Circular Check Icon */}
              <View className="w-20 h-20 rounded-full bg-main justify-center items-center mb-6">
                <Ionicons name="checkmark" size={40} color="#000000" />
              </View>

              {/* Success Title */}
              <Text className="text-white font-sora-bold text-xl text-center mb-3">
                Successful
              </Text>

              {/* Success Message */}
              <Text className="text-neutral200 font-sora text-sm text-center">
              Your NOK has been registered successfully
              </Text>
            </View>

            {/* Bottom Button */}
            <View className="px-6 pb-16">
              <Button
                text="Done"
                onPress={handleModalProceed}
              />
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}