import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { BackIcon } from '@/assets/images/svg';
import Button from '@/components/Button';
import BankIcon from '../../../assets/images/bank.png';
import CardIcon from '../../../assets/images/card.png';

export default function Subscription() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [animation] = useState(new Animated.Value(0));
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const features = [
    "Basic vault creation",
    "Backup 2 wallet seed phrase",
    "Unlimited Multi-seed phrase backup",
    "Inheritance Mode for Next of Kin"
  ];

  const handlePlanChange = (plan: string) => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }).start(() => {
      setSelectedPlan(plan);
      animation.setValue(0);
    });
  };

  const handleUpgrade = () => {
    setShowPaymentModal(true);
  };

  const handleCardPayment = () => {
    console.log('Pay with card selected');
    setShowPaymentModal(false);
  };

  const handleBankTransfer = () => {
    setShowPaymentModal(false);
    router.push('/profile/manage-subscription/bank-transfer');
  };

  const FreeCard = () => (
    <Animated.View
      style={{
        transform: [{
          translateY: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, selectedPlan === 'free' ? -10 : 0]
          })
        }],
        opacity: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, selectedPlan === 'free' ? 1 : 0.9]
        })
      }}
    >
      <TouchableOpacity
        onPress={() => handlePlanChange('free')}
        className={`p-4 rounded-xl mb-4 ${selectedPlan === 'free' ? 'bg-searchBg' : ''}`}
      >
        <View className="flex-row items-center mb-2 -ml-1">
          {selectedPlan === 'free' ? (
            <MaterialIcons name="radio-button-on" size={24} color="#FFD700" />
          ) : (
            <MaterialIcons name="radio-button-unchecked" size={24} color="#B0B0B0" />
          )}
          <Text className="text-neutral100 font-sora-bold text-sm ml-2">Free-mium</Text>
        </View>

        <Text className="text-white font-sora-bold text-xl mb-2">Free</Text>

        <View className="h-px bg-[#484848] my-3" />

        {features.map((feature, index) => (
          <View
            key={index}
            className={`flex-row justify-between items-center py-2 ${index >= 2 ? 'opacity-50' : ''}`}
          >
            <Text className="text-white font-sora text-sm">{feature}</Text>
            {index < 2 ? (
              <Ionicons name="checkmark-circle-sharp" size={20} color="#FFD700" />
            ) : (
              <FontAwesome name="lock" size={20} color="#B0B0B0" />
            )}
          </View>
        ))}
      </TouchableOpacity>
    </Animated.View>
  );

  const PremiumCard = () => (
    <View>
      <TouchableOpacity
        onPress={handleUpgrade} // Open payment modal directly, don’t change plan
        className={`p-4 rounded-xl ${selectedPlan === 'premium' ? 'bg-mainBlack' : ''}`}
        activeOpacity={0.9}
      >
        <View className="flex-row items-center mb-2 -ml-1">
          <MaterialIcons name="radio-button-unchecked" size={24} color="#B0B0B0" />
          <Text className="text-neutral100 font-sora-bold text-sm ml-2">Premium</Text>
        </View>

        <View className="flex-row items-baseline mb-2">
          <Text className="text-white font-sora-bold text-xl">$3.99</Text>
          <Text className="text-neutral100 font-sora text-xs ml-1">/month</Text>
        </View>

        <View className="h-px bg-[#484848] my-3" />

        {features.map((feature, index) => (
          <View key={index} className="flex-row justify-between items-center py-2">
            <Text className="text-white font-sora text-sm">{feature}</Text>
            <Ionicons name="checkmark-circle-sharp" size={20} color="#FFD700" />
          </View>
        ))}

        <View className="mt-8">
          <Button text="Upgrade to Premium" onPress={handleUpgrade} />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 px-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-10">
        <TouchableOpacity onPress={() => router.back()} className="z-10">
          <BackIcon
            style={{
              left: '50%',
              transform: [{ translateX: '-50%' }],
            }}
          />
        </TouchableOpacity>

        <Text className="text-white font-sora-bold text-sm">Manage Subscription</Text>
        <View className="w-10" />
      </View>

      {/* Cards */}
      <View className="flex-1">
        <FreeCard />
        <PremiumCard />
      </View>

      {/* Payment Modal */}
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
    </View>
  );
}
