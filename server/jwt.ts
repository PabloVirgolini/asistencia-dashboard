import * as jose from 'jose';
import { ENV } from './_core/env';

// Helper to get secret key
function getSecret() {
  const secret = ENV.cookieSecret;
  return new TextEncoder().encode(secret);
}

export interface JwtPayload {
  id: number;
  email: string;
  name: string;
  role: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  const alg = 'HS256';
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch (error) {
    return null;
  }
}
