import { AntDesign, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Clipboard,
    Image,
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import Button from '@/components/Button';
import BackIcon from '../../../../assets/images/back.png';
import BankIcon from '../../../../assets/images/bank.png';
import CardIcon from '../../../../assets/images/card.png';

export default function Bank() {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardPayment = () => {
    console.log('Pay with card selected');
    setShowPaymentModal(false);
  };

  const handleBankTransfer = () => {
    setShowPaymentModal(false);
    router.push('/profile/manage-subscription/bank-transfer'); 
  };

  const copyAccountNumber = () => {
    Clipboard.setString('0123456789');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMoney = () => {
    setIsProcessing(true);
    // Simulate processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccessModal(true);
    }, 1500);
  };

  const handleBackToHome = () => {
    setShowSuccessModal(false);
    router.push('/(home)');
  };

  return (
    <View className="flex-1 bg-neutral800 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6 mt-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={BackIcon} className="w-10 h-10" resizeMode="contain" />
        </TouchableOpacity>
        <Text className="text-white font-sora-bold text-sm">Bank Transfer</Text>
        <View className="w-10" />
      </View>

      {/* Amount Section */}
      <View className="items-center mb-6">
        <Text className="text-neutral100 font-sora-semibold text-sm mb-1">Amount</Text>
        <Text className="text-white font-sora-bold text-2xl mb-1">₦5,999.99</Text>
        <Text className="text-neutral200 font-sora text-sm">₦1,503.76 = $1</Text>
      </View>

      {/* Bank Card */}
      <View className="border border-dashed border-neutral100 rounded-lg p-4 mx-3 mb-4">
        <View className="flex-row justify-between mb-4 pb-3">
          <Text className="text-neutral100 font-sora text-sm">Account name</Text>
          <Text className="text-white font-sora-semibold text-sm">K33P Account</Text>
        </View>
        
        <View className="flex-row justify-between mb-4 pb-3">
          <Text className="text-neutral100 font-sora text-sm">Bank name</Text>
          <Text className="text-white font-sora-semibold text-sm">Any Bank</Text>
        </View>
        
        <View className="flex-row justify-between mb-2 pb-3">
          <Text className="text-neutral100 font-sora text-sm">Account number</Text>
          <Text className="text-white font-sora-semibold text-sm">0000000000</Text>
        </View>

        <TouchableOpacity 
          className="flex-row items-center justify-center my-2"
          onPress={copyAccountNumber}
        >
          {copied ? (
            <AntDesign name="checkcircle" size={16} color="#FFD700" />
          ) : (
            <MaterialIcons name="content-copy" size={16} color="#FFD700" />
          )}
          <Text className={`text-xs ml-2 font-sora ${copied ? 'text-main' : 'text-neutral200'}`}>
            {copied ? 'Account number copied' : 'Copy account number'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Change Payment Method */}
      <TouchableOpacity 
        className="items-center my-4"
        onPress={() => setShowPaymentModal(true)}
      >
        <Text className="text-main font-sora-bold text-sm">Change payment method</Text>
      </TouchableOpacity>

      <View className="flex-1" />

      <View className="items-center mb-4 px-4">
        <Text className="text-neutral100 font-sora text-xs text-center">
          <Text className="text-main">Note:</Text> Kindly send the exact amount shown
        </Text>
      </View>

      {/* Button at bottom */}
      <View className="mb-12">
      <Button 
        text={isProcessing ? "Please wait..." : "I have sent the money"} 
        onPress={handleSendMoney}
        outline={isProcessing}
        />

      </View>

      {/* Payment Method Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/90"
          onPress={() => setShowPaymentModal(false)}
        >
          <Pressable className="bg-neutral800 rounded-t-3xl pt-4">
            <View className="items-center mb-4">
              <View className="w-20 h-1 bg-white rounded-2xl mb-3" />
            </View>
            <Text className="text-white font-sora-bold text-sm text-center mb-4 px-6">
              Choose a payment method
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-between py-8 px-4"
              onPress={handleCardPayment}
            >
              <View className="flex-row items-center">
                <Image source={CardIcon} className="mr-3" />
                <Text className="text-neutral100 font-sora-bold text-sm">Pay with card</Text>
              </View>
              <Feather name="arrow-right" size={20} color="#B8B8B8" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between py-6 pb-20 px-4"
              onPress={handleBankTransfer}
            >
              <View className="flex-row items-center">
                <Image source={BankIcon} className="mr-3" />
                <Text className="text-neutral100 font-sora-bold text-sm">Pay with bank transfer</Text>
              </View>
              <Feather name="arrow-right" size={20} color="#B8B8B8" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Success Modal - Bottom 70vh */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
        >
        <Pressable
            className="flex-1 justify-end bg-black/90"
            onPress={() => setShowSuccessModal(false)}
        >
            <Pressable 
            className="bg-neutral800 rounded-t-3xl px-4 py-2"
            style={{ height: '80%' }}
            >
            {/* Drag Line */}
            <View className="items-center mb-6">
                <View className="w-20 h-1 bg-white rounded-full" />
            </View>

            {/* Main content area */}
            <View className="flex-1 justify-center items-center px-6">
                {/* Tick */}
                <View className="items-center justify-center mb-3">
                <Ionicons name="checkmark-circle-sharp" size={100} color="#FFD700" />
                </View>

                {/* Success text */}
                <Text className="text-white font-sora-bold text-lg text-center mb-2">
                Successful!
                </Text>

                {/* Description */}
                <Text className="text-neutral200 font-sora text-sm text-center mb-8 px-1">
                You have successfully upgraded your account to premium
                </Text>
            </View>

            {/* Button at the bottom */}
            <View className="mb-12 px-2">
                <Button 
                text="Back to home page" 
                onPress={handleBackToHome}
                />
            </View>
            </Pressable>
        </Pressable>
        </Modal>

    </View>
  );
}