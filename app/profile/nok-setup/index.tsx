import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import { BackIcon } from '@/assets/images/svg';
import { getSubscriptionStatus, SubscriptionStatus } from '@/utils/payment';
import NokImage from '../../../assets/images/nok.png';
import Button from '../../../components/Button';

export default function Bank() {
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  // Check subscription status on component mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await getSubscriptionStatus();
      
      if (response.success && response.data) {
        setSubscription(response.data);
        
        // If user is on freemium tier, navigate to nok-free
        if (response.data.tier === 'freemium') {
          router.replace('/profile/nok-setup/nok-free');
          return; // Exit early, no need to set loading to false
        } else if (response.data.tier === 'premium' && response.data.isActive) {
          setIsPremium(true);
        } else {
          // Premium but not active - treat as freemium
          router.replace('/profile/nok-setup/nok-free');
          return;
        }
      } else {
        // If we can't get subscription status, assume freemium and redirect
        console.error('Failed to get subscription status:', response.message);
        router.replace('/profile/nok-setup/nok-free');
        return;
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // On error, navigate to freemium page
      router.replace('/profile/nok-setup/nok-free');
      return;
    } finally {
      // Only set loading to false if we didn't navigate away
      setLoading(false);
    }
  };

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => setIsModalVisible(false);

  const handleSetupNOKOver18 = () => {
    closeModal();
    router.push('/profile/nok-setup/register-over18');
  };
  
  const handleSetupNOKUder18 = () => {
    closeModal();
    router.push('/profile/nok-setup/register-under18');
  };

  // Show loading indicator while checking subscription OR if not premium
  if (loading || !isPremium) {
    return (
      <View className="flex-1 justify-center items-center">
        <View className="items-center">
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text className="text-white font-sora mt-4">Checking access...</Text>
        </View>
      </View>
    );
  }

  // Only render the main content if user is confirmed premium
  return (
    <View className="flex-1 px-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <BackIcon
            style={{
              left: '50%',
              transform: [{ translateX: '-50%' }],
            }}
          />
        </TouchableOpacity>
        <Text className="text-white font-sora-bold text-sm">NOK Setup</Text>
        <View className="w-10" />
      </View>

      {/* Premium Badge */}
      <View className="mt-4 bg-green-500/20 rounded-full px-3 py-1 self-center">
        <Text className="text-green-400 font-sora-semibold text-xs">
          ✓ Premium Member
        </Text>
      </View>

      {/* Centered Content */}
      <View className="flex-1 justify-center items-center">
        {/* Centered Image */}
        <Image 
          source={NokImage} 
          className="mb-8" 
          resizeMode="contain"
        />
        
        {/* Centered Text */}
        <View className="items-center mb-8">
          <Text className="text-white font-sora-semibold text-sm mb-2">No NOK Setup</Text>
          <Text className="text-neutral100 font-sora text-sm text-center px-8">
            You have not setup any NOK yet
          </Text>
        </View>

        {/* Setup Button */}
        <TouchableOpacity 
          onPress={openModal}
          className="mt-4"
        >
          <Text className="text-main font-sora-bold text-sm">Set up NOK</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View className="flex-1 bg-black/80 justify-center items-center p-6">
            <TouchableWithoutFeedback>
              <View className="bg-neutral800 rounded-2xl p-6 w-full max-w-sm">
                <View className="items-center gap-5">
                  <Text className="text-neutral100 font-sora text-sm text-center mb-4">
                    If NOK is under 18, a parent or guardian will help guide your Next-of-Kin setup.
                    If NOK is 18 or older, you can set up the Next-of-Kin details
                  </Text>

                  <Button
                    text="NOK is 18 or older"
                    onPress={handleSetupNOKOver18}
                    outline={false}
                  />

                  <Button
                    text="NOK is under 18"
                    onPress={handleSetupNOKUder18}
                    outline={true}
                  />

                  {/* Main Color Text under bottom button */}
                  <Text className="text-neutral100 font-sora text-xs text-center">
                    By proceeding, you confirm and agree to our {"\n"}
                    <Text className="text-main font-sora-semibold ">
                      Terms & Conditions.
                    </Text>
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}