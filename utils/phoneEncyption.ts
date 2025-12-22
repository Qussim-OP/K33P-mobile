import CryptoJS from 'crypto-js';

const PHONE_ENCRYPTION_KEY = 'K33P2024SECUREKEY1234567890ABCDEF';
const FIXED_IV = '0000000000000000';

/**
 * Deterministic AES-256-CBC encryption
 */
export const encryptPhoneData = (phoneNumber: string): string => {
  try {
    const key = CryptoJS.enc.Utf8.parse(PHONE_ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Utf8.parse(FIXED_IV);

    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(phoneNumber),
      key,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    // Return ciphertext only (Base64)
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
  } catch (error) {
    console.error('Error encrypting phone data:', error);
    throw new Error('Failed to encrypt phone data');
  }
};

/**
 * Deterministic AES-256-CBC decryption
 */
export const decryptPhoneData = (encryptedData: string): string => {
  try {
    const key = CryptoJS.enc.Utf8.parse(PHONE_ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Utf8.parse(FIXED_IV);

    // Construct proper CipherParams object for TypeScript
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedData),
    });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting phone data:', error);
    throw new Error('Failed to decrypt phone data');
  }
};
