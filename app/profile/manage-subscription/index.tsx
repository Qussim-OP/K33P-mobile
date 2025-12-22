import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

import { BackIcon } from '@/assets/images/svg';
import Button from '@/components/Button';
import {
  cancelSubscription,
  completePaymentVerification,
  getSubscriptionStatus,
  processPaymentFlow,
  SubscriptionStatus
} from '@/utils/payment';
import BankIcon from '../../../assets/images/bank.png';
import CardIcon from '../../../assets/images/card.png';

export default function Subscription() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('free');
  const [animation] = useState(new Animated.Value(0));
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const features = [
    "Basic vault creation",
    "Backup 2 wallet seed phrase", 
    "Unlimited Multi-seed phrase backup",
    "Inheritance Mode for Next of Kin"
  ];

  // Load subscription status on component mount
  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await getSubscriptionStatus();
      if (response.success && response.data) {
        setSubscriptionStatus(response.data);
        // Set selected plan based on current subscription
        setSelectedPlan(response.data.tier === 'premium' && response.data.isActive ? 'premium' : 'free');
      }
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = async (plan: 'free' | 'premium') => {
    // If switching to free and currently on premium, prompt for cancellation
    if (plan === 'free' && subscriptionStatus?.tier === 'premium' && subscriptionStatus?.isActive) {
      Alert.alert(
        'Cancel Subscription',
        'Are you sure you want to cancel your premium subscription? You will lose access to premium features at the end of your billing period.',
        [
          {
            text: 'Keep Premium',
            style: 'cancel'
          },
          {
            text: 'Cancel Subscription',
            style: 'destructive',
            onPress: async () => {
              setIsProcessing(true);
              try {
                const result = await cancelSubscription();
                if (result.success) {
                  Alert.alert('Success', 'Your subscription has been cancelled.');
                  await loadSubscriptionStatus();
                  setSelectedPlan('free');
                } else {
                  Alert.alert('Error', result.message || 'Failed to cancel subscription');
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to cancel subscription');
              } finally {
                setIsProcessing(false);
              }
            }
          }
        ]
      );
      return;
    }

    // If switching to premium and currently on free, show payment modal
    if (plan === 'premium' && selectedPlan === 'free') {
      setShowPaymentModal(true);
      return;
    }

    // Regular plan change animation
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

  const handleCardPayment = async () => {
    try {
      setIsProcessing(true);
      setShowPaymentModal(false);

      // Initialize payment using the new payment flow
      const paymentResult = await processPaymentFlow(5000); // ₦5,000

      if (!paymentResult.success) {
        Alert.alert('Payment Error', paymentResult.error || 'Failed to initialize payment');
        setIsProcessing(false);
        return;
      }

      // Store payment reference for verification later
      setPaymentReference(paymentResult.reference!);
      
      // Show WebView with Paystack payment page
      setPaymentUrl(paymentResult.paymentUrl!);
      setShowWebView(true);

    } catch (error: any) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', error.message || 'Failed to initialize payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankTransfer = () => {
    setShowPaymentModal(false);
    router.push('/coming-soon');
  };

  const handleWebViewNavigation = async (navState: any) => {
    const { url } = navState;
    
    // Handle payment success - Paystack usually redirects to a success URL
    if (url.includes('/success') || url.includes('trxref=') || url.includes('reference=')) {
      // Extract reference from URL if possible
      const urlParams = new URL(url).searchParams;
      const reference = urlParams.get('trxref') || urlParams.get('reference') || paymentReference;
      
      if (reference) {
        // Verify and activate subscription
        setShowWebView(false);
        setIsProcessing(true);
        
        try {
          const verificationResult = await completePaymentVerification(reference);
          
          if (verificationResult.success && verificationResult.activated) {
            Alert.alert(
              'Payment Successful!', 
              'Your premium subscription has been activated.',
              [
                { 
                  text: 'OK', 
                  onPress: () => {
                    // Refresh subscription status
                    loadSubscriptionStatus();
                    setSelectedPlan('premium');
                    setPaymentReference(null);
                  }
                }
              ]
            );
          } else {
            Alert.alert(
              'Payment Issue', 
              verificationResult.error || 'Payment was successful but subscription activation failed. Please contact support.'
            );
          }
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to verify payment');
        } finally {
          setIsProcessing(false);
        }
      } else {
        // If no reference in URL, just close and refresh
        setShowWebView(false);
        await loadSubscriptionStatus();
        setSelectedPlan('premium');
        setPaymentReference(null);
        Alert.alert('Payment Successful!', 'Your premium subscription has been activated.');
      }
    }
    
    // Handle payment cancellation
    if (url.includes('/cancel') || url.includes('cancelled=true')) {
      setShowWebView(false);
      setPaymentReference(null);
      Alert.alert('Payment Cancelled', 'Your payment was cancelled.');
    }
  };

  const handleWebViewClose = async () => {
    setShowWebView(false);
    
    // If we have a payment reference, verify the payment
    if (paymentReference) {
      setIsProcessing(true);
      try {
        const verificationResult = await completePaymentVerification(paymentReference);
        
        if (verificationResult.success && verificationResult.activated) {
          Alert.alert(
            'Payment Successful!', 
            'Your premium subscription has been activated.',
            [
              { 
                text: 'OK', 
                onPress: () => {
                  // Refresh subscription status
                  loadSubscriptionStatus();
                  setSelectedPlan('premium');
                }
              }
            ]
          );
        } else if (verificationResult.success && !verificationResult.activated) {
          // Payment was verified but not activated (maybe failed or pending)
          Alert.alert(
            'Payment Status', 
            verificationResult.error || 'Your payment is being processed. Please wait a few moments and check your subscription status.'
          );
        } else {
          Alert.alert(
            'Payment Verification Failed', 
            verificationResult.error || 'Unable to verify payment status. Please check your subscription status or contact support.'
          );
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to verify payment');
      } finally {
        setIsProcessing(false);
        setPaymentReference(null);
      }
    } else {
      // Just refresh status in case payment was completed
      await loadSubscriptionStatus();
    }
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

        {/* Show "Switch to Free" button only when on premium */}
        {subscriptionStatus?.tier === 'premium' && subscriptionStatus?.isActive && (
          <View className="mt-8">
            <Button 
              text={isProcessing ? "Processing..." : "Switch to Free"} 
              onPress={() => handlePlanChange('free')}
              isDisabled={isProcessing}
              outline
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const PremiumCard = () => {
    const isActivePremium = subscriptionStatus?.tier === 'premium' && subscriptionStatus?.isActive;
    
    return (
      <View>
        <TouchableOpacity
          onPress={() => handlePlanChange('premium')}
          className={`p-4 rounded-xl ${selectedPlan === 'premium' ? 'bg-mainBlack' : ''}`}
          activeOpacity={0.9}
        >
          <View className="flex-row items-center mb-2 -ml-1">
            {selectedPlan === 'premium' ? (
              <MaterialIcons name="radio-button-on" size={24} color="#FFD700" />
            ) : (
              <MaterialIcons name="radio-button-unchecked" size={24} color="#B0B0B0" />
            )}
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

          {/* Show upgrade button only when not on active premium */}
          {!isActivePremium && (
            <View className="mt-8">
              <Button 
                text={isProcessing ? "Processing..." : "Upgrade to Premium"} 
                onPress={handleUpgrade}
                isDisabled={isProcessing}
              />
            </View>
          )}

          {/* Show active status when on premium */}
          {isActivePremium && subscriptionStatus?.endDate && (
            <View className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-800">
              <Text className="text-green-400 font-sora-bold text-sm text-center">
                Active until {new Date(subscriptionStatus.endDate).toLocaleDateString()}
              </Text>
              {subscriptionStatus.daysRemaining > 0 && subscriptionStatus.daysRemaining <= 7 && (
                <Text className="text-yellow-400 font-sora text-xs text-center mt-1">
                  {subscriptionStatus.daysRemaining} days remaining
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 px-4 bg-mainBlack justify-center items-center">
        <Text className="text-white font-sora">Loading subscription status...</Text>
      </View>
    );
  }

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
              /* onPress={handleCardPayment} */
              onPress={handleBankTransfer}

              disabled={isProcessing}
            >
              <View className="flex-row items-center">
                <Image source={CardIcon} className="mr-3" />
                <Text className="text-neutral100 font-sora-bold text-sm">
                  {isProcessing ? 'Processing...' : 'Pay with card'}
                </Text>
              </View>
              <Feather name="arrow-right" size={20} color="#B8B8B8" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between py-6 pb-20 px-4"
              onPress={handleBankTransfer}
              disabled={isProcessing}
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

      {/* Paystack WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={handleWebViewClose}
      >
        <View className="flex-1 bg-white pt-10">
          <View className="flex-row items-center justify-between px-4 pb-2 border-b border-gray-200">
            <TouchableOpacity onPress={handleWebViewClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-black font-sora-bold text-lg">Complete Payment</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <WebView
            source={{ uri: paymentUrl }}
            onNavigationStateChange={handleWebViewNavigation}
            style={{ flex: 1 }}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      </Modal>
    </View>
  );
}