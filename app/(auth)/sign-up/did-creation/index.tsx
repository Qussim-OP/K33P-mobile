import Button from '@/components/Button';
import { usePhoneStore } from '@/store/usePhoneStore';
import { usePinStore } from '@/store/usePinStore';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Clipboard, Image, Modal, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import InputEndIcon from '../../../../assets/images//paste.png';
import BackButton from '../../../../assets/images/back.png';
import CopyIcon from '../../../../assets/images/Copy.png';
import DidCreationFailed from '../../../../assets/images/did-failed.png';
import ProgressFailed from '../../../../assets/images/did-progress-failed.png';
import DidCreationImage1 from '../../../../assets/images/did_creation.png';
import DidCreationImage2 from '../../../../assets/images/did_creation2.png';
import DidCreationImage3 from '../../../../assets/images/did_creation3.png';
import DidCreationImage4 from '../../../../assets/images/did_creation4.png';
import Progress100 from '../../../../assets/images/progress100.png';
import Progress30 from '../../../../assets/images/progress30.png';
import Progress70 from '../../../../assets/images/progress70.png';
import QRCodeImage from '../../../../assets/images/QR Code-.png';
import SuccessImage from '../../../../assets/images/success.png';

//const BASE_URL = 'https://k33p-backend-i9kj.onrender.com/api';
const BASE_URL = 'http://localhost:3000/api';

const generateUserId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${random}`;
};

export default function DidScreen() {
  const router = useRouter();
  const [showSendAdaModal, setShowSendAdaModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentDidImage, setCurrentDidImage] = useState(DidCreationImage1);
  const [currentProgressImage, setCurrentProgressImage] = useState(Progress30);
  const [progressText, setProgressText] = useState('DID creation in progress...');
  const [showProgress, setShowProgress] = useState(false);
  const [sendingAddress, setSendingAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refundStatus, setRefundStatus] = useState({
    refunded: false,
    txHash: '',
  });
  const [currentStep, setCurrentStep] = useState<'commitment' | 'account' | 'refund' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryData, setRetryData] = useState<{
    userId?: string;
    commitment?: string;
    proof?: any;
  }>({});
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const zkProofRef = useRef<any>(null);
  const zkCommitmentRef = useRef<string | null>(null);

  const { phoneNumber } = usePhoneStore();
  const { pin } = usePinStore();

  const walletAddress = "addr_test1wznyv36t3a2rzfs4q6mvyu7nqlr4dxjwkmykkskafg54yzs735734";

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
    
    if (currentStep === 'commitment') {
      await handleGenerateZKProof();
    } else if (currentStep === 'account') {
      const userId = retryData.userId || generateUserId();
      await createAccountAndLogin(userId);
    } else if (currentStep === 'refund') {
      await triggerImmediateRefund();
    }
  };

  const createAccountAndLogin = async (userId: string) => {
    console.log("--- Creating Account ---");
    setCurrentStep('account');
    setIsLoading(true);
    setRetryData(prev => ({ ...prev, userId })); 

    try {
      if (!zkProofRef.current || !zkCommitmentRef.current) {
        setError("Missing ZK proof or commitment");
        setCurrentDidImage(DidCreationFailed);
        setCurrentProgressImage(ProgressFailed);
        setProgressText('Failed to create account. Missing required data.');
        console.log("Missing ZK proof or commitment");
        
        return;
      }
      
      setCurrentDidImage(DidCreationImage2);
      setCurrentProgressImage(Progress30);

      const userSignupPayload = {
        userId,
        userAddress: sendingAddress,
        phoneNumber: phoneNumber,
        commitment: zkCommitmentRef.current
      };

      const userSignupResponse = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userSignupPayload)
      });

      const userSignupData = await userSignupResponse.json();

      console.log(userSignupData);

      if (!userSignupResponse.ok) {
        if (userSignupData.error?.code === "CONFLICT" ||
            userSignupData.error?.message?.includes("User already exists") ||
            userSignupData.message?.includes("User already exists")) {
          console.log("User already exists. Proceeding with login...");
        } else {
          setError(`Failed to register user: ${userSignupData.error?.message || userSignupData.message}`);
          setCurrentDidImage(DidCreationFailed);
          setCurrentProgressImage(ProgressFailed);
          setProgressText('Account creation failed. Please try again.');
          return;
        }
      }
    
     /*  const zkLoginPayload = {
        phone: phoneNumber,
        proof: {
          proof: zkProofRef.current,
          publicInputs: {
            commitment: zkCommitmentRef.current
          },
          isValid: true
        },
        commitment: zkCommitmentRef.current
      };

      console.log("ZK Login Payload:", zkLoginPayload);
      
      const zkLoginResponse = await fetch(`${BASE_URL}/zk/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zkLoginPayload)
      });

      const zkLoginData = await zkLoginResponse.json();
      
      console.log("zkLoginData:", zkLoginData);
      
      if (!zkLoginResponse.ok || !zkLoginData.success) {
        if (zkLoginData.error?.message?.includes("already exists") || 
            zkLoginData.message?.includes("already exists")) {
          console.log("Account exists but login failed. Generating new credentials...");
          zkProofRef.current = null;
          zkCommitmentRef.current = null;
          await handleGenerateZKProof();
          return;
        }
        
        setError(`Failed to log in with ZK proof: ${zkLoginData.error?.message || zkLoginData.message}`);
        setCurrentDidImage(DidCreationFailed);
        setCurrentProgressImage(ProgressFailed);
        setProgressText('Login failed. Please try again.');
        return;
      }  */

      setCurrentDidImage(DidCreationImage3); 
      setProgressText('DID created. Initiating collateral refund...');
      setCurrentProgressImage(Progress70);

      await triggerImmediateRefund();

    } catch (error) {
      setError(`An unexpected error occurred during account creation/login: ${error}`);
      setCurrentDidImage(DidCreationFailed);
      setCurrentProgressImage(ProgressFailed);
      setProgressText('Account creation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerImmediateRefund = async () => {
    console.log("--- Requesting Immediate Refund ---");
    setCurrentStep('refund');
    setIsLoading(true);
  
    try {
      const refundPayload = {
        userAddress: sendingAddress,
        walletAddress: sendingAddress
      };
  
      const refundResponse = await fetch(`${BASE_URL}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refundPayload)
      });
      
      // Only call .json() once!
      const refundData = await refundResponse.json();
      console.log("Refund response:", refundData);
  
      if (!refundResponse.ok || !refundData.success) {
        setError(`Failed to initiate immediate refund: ${refundData.message}`);
        setCurrentDidImage(DidCreationFailed);
        setCurrentProgressImage(ProgressFailed);
        setProgressText(refundData.message || 'Refund failed. Please try again.');
        return;
      }
  
      setRefundStatus(prev => ({ ...prev, txHash: refundData.data?.txHash }));
      setCurrentDidImage(DidCreationImage4);
      setProgressText('Refund of 2 ADA Collateral to the connected wallet is complete.');
      setCurrentProgressImage(Progress100);
      
      setTimeout(() => {
        router.push('/(auth)/sign-up/name');
      }, 2000);
  
    } catch (error) {
      setError(`Refund error: ${error.message}`);
      setCurrentDidImage(DidCreationFailed);
      setCurrentProgressImage(ProgressFailed);
      setProgressText('Refund failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateZKProof = async () => {
    setCurrentStep('commitment');
    setIsLoading(true);

      try {
        const userId = generateUserId();
        const biometricData = "static_biometric_data_base64_encoded";
        const passkey = pin;
      
        const commitmentPayload = {
          phone: phoneNumber,
          biometric: biometricData,
          passkey: passkey
        };
        console.log("commitmentPayload:", commitmentPayload);
        
        const commitmentResponse = await fetch(`${BASE_URL}/zk/commitment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(commitmentPayload)
        });
        
        const commitmentJson = await commitmentResponse.json();
        const commitmentData = commitmentJson.data || commitmentJson;
        console.log(commitmentData);
        
        if (!commitmentResponse.ok || !commitmentData.commitment) {
          setError(`Failed to generate ZK commitment: ${commitmentData.error?.message || commitmentData.message}`);
          setCurrentDidImage(DidCreationFailed);
          setCurrentProgressImage(ProgressFailed);
          setProgressText('ZK Proof generation failed. Please try again.');
          return;
        } 
      
        // Remove everything after and including the last hyphen
        const cleanCommitment = commitmentData.commitment.replace(/-[^-]*$/, '');
        zkCommitmentRef.current = cleanCommitment;
        console.log("Cleaned zkCommitmentRef.current:", zkCommitmentRef.current);

      const proofPayload = {
        phone: phoneNumber,
        biometric: biometricData,
        passkey: passkey,
        commitment: zkCommitmentRef.current
      };

      console.log("proofPayload:", proofPayload);

      const proofResponse = await fetch(`${BASE_URL}/zk/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proofPayload)
      });
      
      const proofJson = await proofResponse.json();
      const proofData = proofJson.data || proofJson;
      
      if (!proofResponse.ok || !proofData.proof) {
        setError(`Failed to generate ZK proof: ${proofData.error?.message || proofData.message}`);
        setCurrentDidImage(DidCreationFailed);
        setCurrentProgressImage(ProgressFailed);
        setProgressText('ZK Proof generation failed. Please try again.');
        return;
      }
      
       const rawProof = proofData.proof;
/*       if (rawProof.startsWith('zk-proof-')) {
        rawProof = rawProof.substring(8);
      }
      rawProof = rawProof.replace(/^-+/, '');
 */      
      zkProofRef.current = rawProof;
      console.log("zkProofRef.current:", zkProofRef.current);
      
      setRetryData({
        userId,
        commitment: zkCommitmentRef.current,
        proof: zkProofRef.current
      });

      setShowConfirmationModal(false);
      setShowProgress(true);
      setCurrentDidImage(DidCreationImage1);
      setCurrentProgressImage(Progress30);
      setProgressText('DID creation in progress. Awaiting deposit verification and vault setup. Refund of collateral will proceed after DID is created.');

      setTimeout(() => {
        createAccountAndLogin(userId);
      }, 1000);

    } catch (error) {
      setError(`An unexpected error occurred during initial setup: ${error.message}`);
      setCurrentDidImage(DidCreationFailed);
      setCurrentProgressImage(ProgressFailed);
      setProgressText('Initial setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAda = () => {
    setShowSendAdaModal(false);
    setShowConfirmationModal(true);
  };
  
  useEffect(() => {
    if (showConfirmationModal) {
      handleGenerateZKProof();
    }
  }, [showConfirmationModal]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleProceed = () => {
    setShowSendAdaModal(true);
  };

  const handleCopyAddress = () => {
    Clipboard.setString(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="flex-1 bg-mainBlack px-5 pt-12">
      <View className="relative flex-row items-center justify-start mb-12">
        <TouchableOpacity className="z-10" onPress={() => router.back()}>
          <Image source={BackButton} className="w-10 h-10" resizeMode="contain" />
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
          Vault Creation 
        </Text>
        <Text className="text-neutral100 font-sora text-sm mb-6 mr-10">
          A collateral of 2 ADA is required to verify account on-chain & vault SetUp
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
            <Text className="text-neutral100"> Collateral will be fully refunded upon completion of vault setup</Text>
          </Text>
          <Button
            text='Deposit 2ADA'
            onPress={handleProceed}
          />
        </View>
      )}

      {/* Send ADA Modal */}
      <Modal
        visible={showSendAdaModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSendAdaModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSendAdaModal(false)}>
          <View className="flex-1 bg-neutral800/90 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-mainBlack rounded-t-3xl px-6 pb-16">
                <TouchableOpacity className="items-center pt-3 pb-12" onPress={() => setShowSendAdaModal(false)}>
                  <View className="w-16 h-1 bg-white rounded-full" />
                </TouchableOpacity>

                <Text className="text-white font-sora-bold text-lg text-center mb-6">
                  Send 2 ADA
                </Text>

                <View className="items-center mb-6">
                  <Image 
                    source={QRCodeImage} 
                    resizeMode="contain" 
                    className="w-32 h-32"
                  />
                </View>

                <Text className="text-neutral200 font-sora text-xs text-center mb-6 px-20">
                  Scan QR code with camera to send 2ADA
                </Text>

                <View className="flex-row w-full mb-6 overflow-hidden">
                  {[...Array(100)].map((_, i) => (
                    <View 
                      key={i}
                      className="h-px w-[.5px] bg-neutral200 mx-0.5"
                    />
                  ))}
                </View>                

                <Text
                  style={{ letterSpacing: .78 }} 
                  className="text-white text-xs text-center font-space-mono mb-4 px-5 leading-relaxed break-words max-w-[300px] mx-auto"
                  numberOfLines={3}
                >
                  {walletAddress}
                </Text>

                <TouchableOpacity 
                  className="flex-row items-center justify-center mb-8"
                  onPress={handleCopyAddress}
                >
                  {copied ? (
                    <Ionicons name="checkmark" size={16} color="#FFD939" className="mr-2" />
                  ) : (
                    <Image 
                      source={CopyIcon}
                      className="w-5 h-5 mr-2"
                      resizeMode="contain"
                    />
                  )}

                  <Text className={`font-sora text-sm ${copied ? "text-main" : "text-neutral200"}`}>
                    {copied ? "Copied!" : "Copy"}
                  </Text>
                </TouchableOpacity>
                
                <View className="mb-8 w-full mt-5">
                  <Text className="text-white font-sora text-sm mb-3">
                    Your sending address
                  </Text>
                  <View className="flex-row items-center border border-neutral200 rounded-md px-3 ">
                    <TextInput
                      placeholder="Paste ADA address"
                      placeholderTextColor="#A0A0A0"
                      className="flex-1 text-white font-sora text-sm h-12"
                      value={sendingAddress}
                      onChangeText={setSendingAddress}
                    />
                    <Image 
                      source={InputEndIcon} 
                      className="ml-2"
                      resizeMode="contain"
                    />
                  </View>
                </View>
                
                <View className="flex-row items-center mt-3 mb-4">
                  <TouchableOpacity 
                    onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
                    className="mr-2"
                  >
                    {acceptedPrivacy ? (
                      <Ionicons name="checkbox" size={24} color="#FFD939" />
                    ) : (
                      <Ionicons name="checkbox-outline" size={24} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                  <Text className="text-white font-sora text-sm">
                    Accept the <Text className="text-main">Privacy Policy & T&U</Text>
                  </Text>
                </View>

                <Button
                  text={isLoading ? "Processing..." : "I have sent 2 ADA"}
                  onPress={handleSendAda}
                  isDisabled={!sendingAddress || !acceptedPrivacy || isLoading}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        animationType="slide"
        transparent={true}
        //onRequestClose={() => setShowConfirmationModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => {}}>
          <View className="flex-1 bg-[#0a0a0a]/90 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-[#1a1a1a] rounded-t-3xl px-6 pb-16">
                <TouchableOpacity className="items-center pt-3 " onPress={() => setShowConfirmationModal(false)}>
                  <View className="w-14 h-1 bg-neutral100 rounded-full mb-10" />
                </TouchableOpacity>

                <Text className="text-neutral200 font-sora text-xs text-center mb-2">Connected Wallet</Text>
                <Text className="text-white font-space-mono-bold uppercase text-sm text-center mb-20">
                  {sendingAddress.length > 15
                    ? `${sendingAddress.slice(0, 15)}...`
                    : sendingAddress}
                </Text>
                
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
                  A collateral of 2 ADA is required to verify your account setup.
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