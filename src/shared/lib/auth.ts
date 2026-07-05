import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'df-super-secret-signature-key-998877';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'chef' | 'runner';
  exp: number;
}

// Signs a payload into a secure base64-encoded token with HMAC signature
export function signToken(payload: Omit<SessionPayload, 'exp'>, expiryInSeconds: number = 86400): string {
  const exp = Math.floor(Date.now() / 1000) + expiryInSeconds;
  const fullPayload: SessionPayload = { ...payload, exp };
  
  const payloadStr = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  // Create HMAC signature
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(payloadStr);
  const signature = hmac.digest('base64url');
  
  return `${payloadStr}.${signature}`;
}

// Verifies and decodes a token, returning payload if valid or null if expired/tampered
export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [payloadStr, signature] = parts;
    
    // Validate signature
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(payloadStr);
    const expectedSignature = hmac.digest('base64url');
    
    if (signature !== expectedSignature) {
      console.warn('[Auth Utility] Token signature verification failed');
      return null;
    }
    
    // Decode payload
    const decodedPayloadStr = Buffer.from(payloadStr, 'base64url').toString('utf8');
    const payload = JSON.parse(decodedPayloadStr) as SessionPayload;
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.warn('[Auth Utility] Token has expired');
      return null;
    }
    
    return payload;
  } catch (e) {
    console.error('[Auth Utility] Token verification error:', e);
    return null;
  }
}

// Compares passwords (using direct string equality for simplified mock validation, but can be updated)
export function verifyPassword(plain: string, hash: string): boolean {
  return plain === hash;
}
