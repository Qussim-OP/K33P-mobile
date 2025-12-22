// utils/payment.ts
import { useAuthStore } from '@/store/useAuthMethod';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://k33p-backend-i9kj.onrender.com/api';

// Types
export interface SubscriptionStatus {
  tier: 'freemium' | 'premium';
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
  autoRenew: boolean;
}

export interface PaymentInitialization {
  reference: string;
  authorization_url: string;
  access_code: string;
}

export interface PaymentVerification {
  reference: string;
  amount: number;
  status: string;
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string;
  };
  customer: {
    id: number;
    email: string;
    customer_code: string;
  };
  metadata: {
    userId: string;
    subscriptionType: string;
  };
}

// Response Types
export interface SubscriptionStatusResponse {
  success: boolean;
  data?: SubscriptionStatus;
  message?: string;
  error?: string;
}

export interface PaymentInitializationResponse {
  success: boolean;
  data?: PaymentInitialization;
  message?: string;
  error?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  data?: PaymentVerification;
  message?: string;
  error?: string;
}

export interface BasicResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Generic request function
async function makeRequest(method: string, endpoint: string, data?: any, requiresAuth: boolean = true) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if required
  if (requiresAuth) {
    const { token } = useAuthStore.getState();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      throw new Error('Authentication required');
    }
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    const responseData = await response.json();
    
    return {
      status: response.status,
      body: responseData,
    };
  } catch (error: any) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Get current subscription status for authenticated user
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  try {
    const response = await makeRequest('GET', '/subscription/status');
    
    if (response.body.success) {
      console.log('Subscription status retrieved successfully:', response.body.data);
      return response.body;
    } else {
      console.log('Get subscription status failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to fetch subscription status'
      };
    }
  } catch (error: any) {
    console.log('Get subscription status request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to fetch subscription status'
    };
  }
}

/**
 * Initialize Paystack payment for premium subscription
 */
export async function initializePayment(amount?: number): Promise<PaymentInitializationResponse> {
  try {
    const paymentData = {
      amount: amount || 5000 // Default to 5000 NGN (~$5)
    };

    const response = await makeRequest('POST', '/payment/initialize', paymentData);
    
    if (response.body.success) {
      console.log('Payment initialized successfully:', response.body.data?.reference);
      return response.body;
    } else {
      console.log('Payment initialization failed:', response.body.error);
      return {
        success: false,
        error: response.body.error || 'Failed to initialize payment'
      };
    }
  } catch (error: any) {
    console.log('Payment initialization request failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to initialize payment'
    };
  }
}

/**
 * Verify Paystack payment and activate subscription
 */
export async function verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
  try {
    // Validate required fields
    if (!reference || reference.trim().length === 0) {
      return {
        success: false,
        error: 'Payment reference is required'
      };
    }

    const response = await makeRequest('POST', '/payment/verify', { reference });
    
    if (response.body.success) {
      console.log('Payment verified successfully:', response.body.data?.reference);
      return response.body;
    } else {
      console.log('Payment verification failed:', response.body.error);
      return {
        success: false,
        error: response.body.error || 'Failed to verify payment'
      };
    }
  } catch (error: any) {
    console.log('Payment verification request failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to verify payment'
    };
  }
}

/**
 * Activate premium subscription directly (for testing or after payment verification)
 */
export async function activateSubscription(reference: string, durationMonths: number = 1): Promise<BasicResponse> {
  try {
    const activationData = {
      reference,
      durationMonths
    };

    const response = await makeRequest('POST', '/subscription/activate', activationData);
    
    if (response.body.success) {
      console.log('Subscription activated successfully');
      return response.body;
    } else {
      console.log('Subscription activation failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to activate subscription'
      };
    }
  } catch (error: any) {
    console.log('Subscription activation request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to activate subscription'
    };
  }
}

/**
 * Cancel current premium subscription
 */
export async function cancelSubscription(): Promise<BasicResponse> {
  try {
    const response = await makeRequest('POST', '/subscription/cancel');
    
    if (response.body.success) {
      console.log('Subscription cancelled successfully');
      return response.body;
    } else {
      console.log('Subscription cancellation failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to cancel subscription'
      };
    }
  } catch (error: any) {
    console.log('Subscription cancellation request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to cancel subscription'
    };
  }
}

/**
 * Get payment configuration for frontend
 */
export async function getPaymentConfig(): Promise<BasicResponse> {
  try {
    const response = await makeRequest('GET', '/payment/config');
    
    if (response.body.success) {
      console.log('Payment config retrieved successfully');
      return response.body;
    } else {
      console.log('Get payment config failed:', response.body.error);
      return {
        success: false,
        error: response.body.error || 'Failed to fetch payment config'
      };
    }
  } catch (error: any) {
    console.log('Get payment config request failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to fetch payment config'
    };
  }
}

/**
 * Get payment history for user
 */
export async function getPaymentHistory(page: number = 1, limit: number = 10): Promise<BasicResponse> {
  try {
    const response = await makeRequest('GET', `/payment/history?page=${page}&limit=${limit}`);
    
    if (response.body.success) {
      console.log('Payment history retrieved successfully');
      return response.body;
    } else {
      console.log('Get payment history failed:', response.body.error);
      return {
        success: false,
        error: response.body.error || 'Failed to fetch payment history'
      };
    }
  } catch (error: any) {
    console.log('Get payment history request failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to fetch payment history'
    };
  }
}

/**
 * Initialize monthly recurring subscription with phone number
 */
export async function initializeMonthlySubscription(phone: string, amount?: number): Promise<PaymentInitializationResponse> {
  try {
    const subscriptionData = {
      phone,
      amount: amount || 5000 // Default to 5000 NGN monthly
    };

    const response = await makeRequest('POST', '/payment/initialize-monthly', subscriptionData);
    
    if (response.body.success) {
      console.log('Monthly subscription initialized successfully:', response.body.data?.reference);
      return response.body;
    } else {
      console.log('Monthly subscription initialization failed:', response.body.error);
      return {
        success: false,
        error: response.body.error || 'Failed to initialize monthly subscription'
      };
    }
  } catch (error: any) {
    console.log('Monthly subscription initialization request failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to initialize monthly subscription'
    };
  }
}

/**
 * Get recurring subscription details
 */
export async function getSubscriptionDetails(): Promise<BasicResponse> {
  try {
    const response = await makeRequest('GET', '/payment/subscription/details');
    
    if (response.body.success) {
      console.log('Subscription details retrieved successfully');
      return response.body;
    } else {
      console.log('Get subscription details failed:', response.body.error);
      return {
        success: false,
        error: response.body.error || 'Failed to fetch subscription details'
      };
    }
  } catch (error: any) {
    console.log('Get subscription details request failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to fetch subscription details'
    };
  }
}

/**
 * Cancel recurring subscription
 */
export async function cancelRecurringSubscription(): Promise<BasicResponse> {
  try {
    const response = await makeRequest('POST', '/payment/subscription/cancel-recurring');
    
    if (response.body.success) {
      console.log('Recurring subscription cancelled successfully');
      return response.body;
    } else {
      console.log('Recurring subscription cancellation failed:', response.body.error);
      return {
        success: false,
        error: response.body.error || 'Failed to cancel recurring subscription'
      };
    }
  } catch (error: any) {
    console.log('Recurring subscription cancellation request failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to cancel recurring subscription'
    };
  }
}

// Helper functions

/**
 * Check if user has active premium subscription
 */
export async function hasActivePremiumSubscription(): Promise<boolean> {
  try {
    const statusResponse = await getSubscriptionStatus();
    return statusResponse.success && 
           statusResponse.data?.tier === 'premium' && 
           statusResponse.data?.isActive === true;
  } catch (error) {
    console.error('Error checking premium subscription:', error);
    return false;
  }
}

/**
 * Check if user can add more wallets based on subscription
 */
export async function canAddWallet(currentWalletCount: number): Promise<{
  canAdd: boolean;
  reason?: string;
  maxAllowed?: number;
}> {
  try {
    const statusResponse = await getSubscriptionStatus();
    
    if (!statusResponse.success) {
      return {
        canAdd: false,
        reason: 'Unable to verify subscription status'
      };
    }

    const { tier, isActive } = statusResponse.data!;
    
    // Freemium tier limits
    if (tier === 'freemium') {
      const maxFreemiumWallets = 3;
      if (currentWalletCount >= maxFreemiumWallets) {
        return {
          canAdd: false,
          reason: 'Free tier limited to 3 wallets. Upgrade to premium for unlimited wallets.',
          maxAllowed: maxFreemiumWallets
        };
      }
      return {
        canAdd: true,
        maxAllowed: maxFreemiumWallets
      };
    }

    // Premium tier (active)
    if (tier === 'premium' && isActive) {
      const maxPremiumWallets = 50;
      if (currentWalletCount >= maxPremiumWallets) {
        return {
          canAdd: false,
          reason: 'Premium tier wallet limit reached',
          maxAllowed: maxPremiumWallets
        };
      }
      return {
        canAdd: true,
        maxAllowed: maxPremiumWallets
      };
    }

    // Premium tier (inactive/expired)
    if (tier === 'premium' && !isActive) {
      return {
        canAdd: false,
        reason: 'Your premium subscription has expired. Please renew to add more wallets.'
      };
    }

    return {
      canAdd: false,
      reason: 'Unknown subscription status'
    };
  } catch (error) {
    console.error('Error checking wallet addition eligibility:', error);
    return {
      canAdd: false,
      reason: 'Error checking subscription status'
    };
  }
}

/**
 * Get subscription tier information
 */
export function getTierInfo(tier: 'freemium' | 'premium') {
  const tiers = {
    freemium: {
      name: 'Freemium',
      maxWallets: 3,
      features: ['Basic wallet storage', 'Limited support', '3 wallet limit'],
      price: 'Free'
    },
    premium: {
      name: 'Premium', 
      maxWallets: 50,
      features: ['Unlimited wallet storage', 'Priority support', 'Advanced security', 'Auto-renewal'],
      price: '₦5,000/month'
    }
  };
  
  return tiers[tier];
}

/**
 * Format amount for display
 */
export function formatAmount(amountInKobo: number): string {
  return `₦${(amountInKobo / 100).toLocaleString()}`;
}

/**
 * Validate phone number for recurring subscription
 */
export function validatePhoneNumber(phone: string): { valid: boolean; message?: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, message: 'Phone number is required' };
  }
  
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: 'Valid phone number is required' };
  }
  
  return { valid: true };
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number): { valid: boolean; message?: string } {
  if (amount < 1000) {
    return { valid: false, message: 'Amount must be at least ₦1,000' };
  }
  
  if (amount > 1000000) {
    return { valid: false, message: 'Amount must be less than ₦1,000,000' };
  }
  
  return { valid: true };
}

/**
 * Process complete payment flow
 */
export async function processPaymentFlow(amount: number = 5000): Promise<{
  success: boolean;
  paymentUrl?: string;
  reference?: string;
  error?: string;
}> {
  try {
    // Step 1: Initialize payment
    const initResponse = await initializePayment(amount);
    
    if (!initResponse.success || !initResponse.data) {
      return {
        success: false,
        error: initResponse.error || 'Failed to initialize payment'
      };
    }

    return {
      success: true,
      paymentUrl: initResponse.data.authorization_url,
      reference: initResponse.data.reference
    };
  } catch (error: any) {
    console.error('Payment flow error:', error);
    return {
      success: false,
      error: error.message || 'Payment processing failed'
    };
  }
}

/**
 * Complete payment verification and activation
 */
export async function completePaymentVerification(reference: string): Promise<{
  success: boolean;
  activated: boolean;
  error?: string;
}> {
  try {
    // Step 1: Verify payment
    const verifyResponse = await verifyPayment(reference);
    
    if (!verifyResponse.success) {
      return {
        success: false,
        activated: false,
        error: verifyResponse.error || 'Payment verification failed'
      };
    }

    // Step 2: If payment successful, activate subscription
    if (verifyResponse.data?.status === 'success') {
      const activateResponse = await activateSubscription(reference);
      
      if (activateResponse.success) {
        return {
          success: true,
          activated: true
        };
      } else {
        return {
          success: false,
          activated: false,
          error: activateResponse.message || 'Failed to activate subscription after payment'
        };
      }
    } else {
      return {
        success: true,
        activated: false,
        error: `Payment status: ${verifyResponse.data?.status}`
      };
    }
  } catch (error: any) {
    console.error('Payment verification flow error:', error);
    return {
      success: false,
      activated: false,
      error: error.message || 'Payment verification failed'
    };
  }
}


