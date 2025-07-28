import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Get encryption key from environment or generate for development
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (keyHex) {
    return Buffer.from(keyHex, 'hex');
  }
  
  // For development only - generate a random key
  if (process.env.NODE_ENV === 'development') {
    console.warn('Warning: Using generated encryption key for development. Set ENCRYPTION_KEY in production.');
    return crypto.randomBytes(KEY_LENGTH);
  }
  
  throw new Error('ENCRYPTION_KEY environment variable must be set in production');
}

const encryptionKey = getEncryptionKey();

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

/**
 * Encrypt sensitive data like API tokens
 */
export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipherGCM(ALGORITHM, encryptionKey, iv);
  cipher.setAAD(Buffer.from('fleetchat-api-token'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Decrypt sensitive data like API tokens
 */
export function decrypt(encryptedData: EncryptedData): string {
  const { encrypted, iv, tag } = encryptedData;
  
  const decipher = crypto.createDecipherGCM(ALGORITHM, encryptionKey, Buffer.from(iv, 'hex'));
  decipher.setAAD(Buffer.from('fleetchat-api-token'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash data for secure comparison
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate secure random tokens
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}