import aes from 'react-native-aes-crypto';
import { pbkdf2Sync, randomBytes } from 'react-native-randombytes';

const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'your-secure-default-key';
const SALT = 'static-salt-value'; // Should be constant for PBKDF2

export const generateUserSpecificKey = (userId: string, pin: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const key = pbkdf2Sync(
        `${userId}${pin}`,
        SALT,
        1000,
        256/8,
        'sha256'
      ).toString('hex');
      resolve(key);
    } catch (error) {
      reject(error);
    }
  });
};

export const encryptPhoneNumber = async (phoneNumber: string, key: string): Promise<string> => {
  try {
    const iv = randomBytes(16).toString('hex');
    const cipher = await aes.encrypt(phoneNumber, key, iv, 'aes-256-cbc');
    return `${iv}:${cipher}`; // Store IV with ciphertext
  } catch (error) {
    console.error('Error encrypting phone number:', error);
    throw new Error('Failed to encrypt phone number');
  }
};

export const decryptPhoneNumber = async (encryptedPhone: string, key: string): Promise<string> => {
  try {
    const [iv, cipher] = encryptedPhone.split(':');
    if (!iv || !cipher) throw new Error('Invalid encrypted data format');
    
    const decrypted = await aes.decrypt(cipher, key, iv, 'aes-256-cbc');
    if (!decrypted) throw new Error('Decryption failed - empty result');
    return decrypted;
  } catch (error) {
    console.error('Error decrypting phone number:', error);
    throw new Error('Failed to decrypt phone number');
  }
};

export const getEncryptedPhone = async (phoneNumber: string, userId: string, pin: string): Promise<string> => {
  try {
    const key = await generateUserSpecificKey(userId, pin);
    return await encryptPhoneNumber(phoneNumber, key);
  } catch (error) {
    console.error('Error getting encrypted phone:', error);
    throw error;
  }
};