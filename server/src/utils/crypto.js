const crypto = require('crypto');

const ENC_KEY = process.env.ENCRYPTION_KEY;
if (!ENC_KEY || ENC_KEY.length !== 64) {
  console.warn('[crypto] ENCRYPTION_KEY missing or wrong length — encryption disabled');
}

const ALGO = 'aes-256-cbc';

/**
 * Encrypt a plaintext string.
 * Returns "iv:encrypted" or the plaintext if encryption is not configured.
 */
function encrypt(text) {
  if (!text) return '';
  if (!ENC_KEY) return text;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, Buffer.from(ENC_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string produced by encrypt().
 * Returns the plaintext, or the input unchanged if not encrypted.
 */
function decrypt(text) {
  if (!text) return '';
  if (!ENC_KEY) return text;

  const parts = text.split(':');
  if (parts.length !== 2) return text; // not encrypted, return as-is

  try {
    const [ivHex, encrypted] = parts;
    const decipher = crypto.createDecipheriv(ALGO, Buffer.from(ENC_KEY, 'hex'), Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[crypto] decrypt failed:', err.message);
    return '';
  }
}

/**
 * Mask a token for display: "vcp_3Ur8...9ee4"
 */
function maskToken(token) {
  if (!token || token.length < 12) return '****';
  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

module.exports = { encrypt, decrypt, maskToken };