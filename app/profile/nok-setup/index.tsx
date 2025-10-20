import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import { BackIcon } from '@/assets/images/svg';
import NokImage from '../../../assets/images/nok.png';
import Button from '../../../components/Button'; // Adjust import path as needed

export default function Bank() {
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  const handleSetupNOKOver18 = () => {
    closeModal();
    router.push('/profile/nok-setup/register-over18');
  };
  const handleSetupNOKUder18 = () => {
    closeModal();
    router.push('/profile/nok-setup/register-under18');
  };

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