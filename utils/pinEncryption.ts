// utils/pinEncryption.ts
import CryptoJS from 'crypto-js';

// Use the SAME approach as phone encryption for deterministic results
const PIN_ENCRYPTION_KEY = 'PIN2024SECUREKEY9876543210ZYXWVUT'; // 32 chars for AES-256
const FIXED_IV = '0000000000000000'; // 16 chars for AES

/**
 * Deterministic PIN encryption - same input always produces same output
 */
export const encryptPinData = (pin: string, userId: string): string => {
  try {
    // Create a consistent data string to encrypt
    const dataToEncrypt = `${pin}|${userId}`;
    
    // Use the same approach as phone encryption
    const key = CryptoJS.enc.Utf8.parse(PIN_ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Utf8.parse(FIXED_IV);

    const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Return as Base64 string
    return encrypted.toString();
  } catch (error) {
    console.error('Error encrypting PIN data:', error);
    throw new Error('Failed to encrypt PIN');
  }
};

/**
 * Verify if the input PIN matches the stored encrypted PIN
 */
export const verifyPinHash = (inputPin: string, userId: string, storedPinHash: string): boolean => {
  try {
    const computedHash = encryptPinData(inputPin, userId);
    console.log('🔐 PIN VERIFICATION COMPARISON:');
    console.log('• Input PIN hash:', computedHash);
    console.log('• Stored PIN hash:', storedPinHash);
    console.log('• Hashes match:', computedHash === storedPinHash);
    
    return computedHash === storedPinHash;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
};

// Keep other functions the same...
export const decryptPinData = (encryptedData: string): { pin: string; userId: string } => {
  try {
    const key = CryptoJS.enc.Utf8.parse(PIN_ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Utf8.parse(FIXED_IV);

    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    const [pin, userId] = decryptedText.split('|');
    
    return { pin, userId };
  } catch (error) {
    console.error('Error decrypting PIN data:', error);
    throw new Error('Failed to decrypt PIN');
  }
};