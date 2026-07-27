import { BackIcon } from '@/assets/images/svg';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/useAuthMethod';
import { usePhoneStore } from '@/store/usePhoneStore';
import { usePinStore } from '@/store/usePinStore';
import {
  createAuthMethods,
  createDID,
  signupUser
} from '@/utils/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import DidCreationFailed from '../../../../assets/images/did-failed.png';
import ProgressFailed from '../../../../assets/images/did-progress-failed.png';
import DidCreationImage1 from '../../../../assets/images/did_creation.png';
import DidCreationImage2 from '../../../../assets/images/did_creation2.png';
import DidCreationImage3 from '../../../../assets/images/did_creation3.png';
import DidCreationImage4 from '../../../../assets/images/did_creation4.png';
import Progress100 from '../../../../assets/images/progress100.png';
import Progress30 from '../../../../assets/images/progress30.png';
import Progress70 from '../../../../assets/images/progress70.png';
import SuccessImage from '../../../../assets/images/success.png';

const generateUserId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${random}`;
};

export default function DidScreen() {
  const router = useRouter();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentDidImage, setCurrentDidImage] = useState(DidCreationImage1);
  const [currentProgressImage, setCurrentProgressImage] = useState(Progress30);
  const [progressText, setProgressText] = useState('DID creation in progress...');
  const [showProgress, setShowProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'did_creation' | 'account' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryData, setRetryData] = useState<{
    userId?: string;
    did?: string;
  }>({});
  const didRef = useRef<string | null>(null);

  const { phoneNumber } = usePhoneStore();
  const { pin } = usePinStore();
  const { setUserId, setWalletAddress, setUserAuthMethods, setToken } = useAuthStore();

  const showAlert = (title, message) => {
    Alert.alert(title, message);
  };

  const resetFlow = () => {
    setCurrentDidImage(DidCreationImage1);
    setCurrentProgressImage(Progress30);
    setProgressText('DID creation in progress...');
    setError(null);
    setShowProgress(true);
  };

  const handleRetry = async () => {
    if (!currentStep) return;
    
    resetFlow();
    
    if (currentStep === 'did_creation') {
      await handleCreateDID();
    } else if (currentStep === 'account') {
      const userId = retryData.userId || generateUserId();
      await createAccountAndLogin(userId);
    }
  };

  const createAccountAndLogin = async (userId: string) => {
    console.log("--- Creating Account ---");
    setCurrentStep('account');
    setIsLoading(true);
    setRetryData(prev => ({ ...prev, userId })); 
  
    try {
      if (!didRef.current) {
        setError("Missing DID");
        setCurrentDidImage(DidCreationFailed);
        setCurrentProgressImage(ProgressFailed);
        setProgressText('Failed to create account. Missing DID.');
        console.log("Missing DID");
        return;
      }
      
      setCurrentDidImage(DidCreationImage2);
      setCurrentProgressImage(Progress30);
  
      console.log("--- Step 1: Creating Account ---");
      
      // Generate encrypted hashes and auth methods using utility function
      const authMethods = createAuthMethods(phoneNumber, pin, userId);
  
      // Prepare signup payload with Midnight DID
      const signupPayload = {
        userId: userId,
        did: didRef.current,
        phoneHash: authMethods.find(m => m.type === 'phone')?.data || '',
        pinHash: authMethods.find(m => m.type === 'pin')?.data || '',
        authMethods: authMethods,
        verificationMethod: 'phone'
      };
  
      console.log("Signup Payload:", {
        ...signupPayload,
        authMethods: authMethods.map(m => ({ type: m.type, hasData: !!m.data }))
      });
  
      // Use API utility function for signup
      const signupData = await signupUser(signupPayload);
      console.log("Signup Response:", signupData);
  
      // Save token and user data to store after successful signup
      if (signupData.data?.token) {
        setToken(signupData.data.token);
        console.log('Token saved to store after signup');
      }
      
      if (signupData.data?.userId) {
        setUserId(signupData.data.userId);
      }
      
      if (signupData.data?.did) {
        setWalletAddress(signupData.data.did);
      }
      
      if (signupData.data?.authMethods) {
        setUserAuthMethods(signupData.data.authMethods);
      }
  
      // STEP 3: Complete DID creation flow
      console.log("--- Step 3: DID Creation Complete ---");
      setCurrentDidImage(DidCreationImage3); 
      setProgressText('DID created successfully. Setting up your vault...');
      setCurrentProgressImage(Progress70);
      
      setCurrentDidImage(DidCreationImage4);
      setProgressText('DID and vault setup complete. Welcome to K33P!');
      setCurrentProgressImage(Progress100);
      
      setTimeout(() => {
        router.push('/(auth)/sign-up/name');
      }, 2000); 
  
    } catch (error: unknown) {
      console.error("Account creation error:", error);
      
      let errorMessage = 'An unexpected error occurred during account creation. Please try again.';
      
      if (error instanceof Error) {
        if (error.message?.includes('Network request failed')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      setCurrentDidImage(DidCreationFailed);
      setCurrentProgressImage(ProgressFailed);
      setProgressText(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDID = async () => {
    setCurrentStep('did_creation');
    setIsLoading(true);

    try {
      const userId = generateUserId();
      
      // Use Midnight Passport SDK to create DID
      console.log("Creating Midnight DID...");
      const didResult = await createDID({
        userId,
        phoneNumber,
        pin
      });
      
      if (didResult.success && didResult.did) {
        didRef.current = didResult.did;
        console.log("DID created:", didRef.current);
        
        setRetryData({
          userId,
          did: didRef.current
        });

        setShowConfirmationModal(false);
        setShowProgress(true);
        setCurrentDidImage(DidCreationImage1);
        setCurrentProgressImage(Progress30);
        setProgressText('DID creation in progress. Setting up your identity vault...');

        setTimeout(() => {
          createAccountAndLogin(userId);
        }, 1000);
      } else {
        throw new Error(didResult.error || 'Failed to create DID');
      }

    } catch (error: any) {
      setError(`An unexpected error occurred during DID creation: ${error.message}`);
      setCurrentDidImage(DidCreationFailed);
      setCurrentProgressImage(ProgressFailed);
      setProgressText('DID creation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (showConfirmationModal) {
      handleCreateDID();
    }
  }, [showConfirmationModal]);

  const handleProceed = () => {
    setShowConfirmationModal(true);
  };

  return (
    <View className="flex-1  px-5">
      <View className="relative flex-row items-center justify-start mb-12">
        <TouchableOpacity className="z-10" onPress={() => router.back()}>
        <BackIcon width={40} height={40} /> 
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <Text className="text-white font-sora-bold text-sm mb-1">
          DID Creation / Vault Setup
        </Text>

        <View className="mt-2 mb-8">
          {['Mobile Number ', 'PIN Setup', 'Face ID'].map((item, index) => (
            <View key={index} className="flex-row items-center mb-3">
              <MaterialIcons 
                name="check-circle" 
                size={20} 
                color="#FFD939" 
                className="mr-2"
              />
              <Text className="text-neutral100 font-sora text-sm">
                {item}
              </Text>
            </View>
          ))}
        </View>

        <Text className="text-white font-sora-bold text-sm mb-2">
          DID Creation 
        </Text>
        <Text className="text-neutral100 font-sora text-sm mb-6 mr-10">
          Creating your decentralized identity using Midnight Passport
        </Text>

        <View className="items-center mb-4">
          <Image 
            source={currentDidImage} 
            className="w-80 h-12 mb-4"
          />
        </View>

        {showProgress && (
          <View className="items-center mt-12">
            <Image 
              source={currentProgressImage} 
              className="w-52 h-52 mb-4" 
              resizeMode="contain" 
            />
            <Text className={`text-center font-sora text-sm mb-4 ${error ? 'text-red-500' : 'text-main'}`}>
              {progressText}
            </Text>
            
            {error && (
              <Button
                text="Try Again"
                onPress={handleRetry}
                outline
              />
            )}
            
            {refundStatus.txHash && (
              <Text className="text-green-500 mt-2 font-sora text-xs">
                Refund TX: {refundStatus.txHash.slice(0, 12)}...{refundStatus.txHash.slice(-6)}
              </Text>
            )}
          </View>
        )}
      </View>

      {!showProgress && (
        <View className='mb-16'>
          <Text className="text-main font-sora text-xs text-center mb-4">
            Note: 
            <Text className="text-neutral100"> Your DID will be created securely using Midnight Passport</Text>
          </Text>
          <Button
            text='Create DID'
            onPress={handleProceed}
          />
        </View>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        animationType="slide"
        transparent={true}
      >
        <TouchableWithoutFeedback onPress={() => {}}>
          <View className="flex-1 bg-[#0a0a0a]/90 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-[#1a1a1a] rounded-t-3xl px-6 pb-16">
                <TouchableOpacity className="items-center pt-3 " onPress={() => setShowConfirmationModal(false)}>
                  <View className="w-14 h-1 bg-neutral100 rounded-full mb-10" />
                </TouchableOpacity>

                <View className="items-center">
                  <Image 
                    source={SuccessImage} 
                    className="mb-5" 
                    resizeMode="contain"
                  />
                  <Text className="text-white font-sora-bold text-lg text-center mb-2">
                  Security Setup Done
                  </Text>
                  <Text className="text-neutral200 font-sora text-sm text-center">
                  Creating your decentralized identity using Midnight Passport.
                  </Text>
                </View>

                <View className="items-center px-6 my-16">
                  <Image 
                    source={DidCreationImage1} 
                    className="w-full" 
                    resizeMode="contain" 
                  />
                </View>
                
                <Button
                  text="Please wait..."
                  onPress={() => {}}
                  outline
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}