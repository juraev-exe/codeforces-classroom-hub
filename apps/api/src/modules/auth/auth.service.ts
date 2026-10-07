import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@cf-hub/database';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  codeforcesHandle?: string | null;
}

export class AuthService {
  async login(email: string, password: string):Promise<{ token: string; user: UserPayload }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const payload: UserPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      codeforcesHandle: user.codeforcesHandle,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return { token, user: payload };
  }

  verifyToken(token: string): UserPayload | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (
        typeof payload === 'string' ||
        typeof payload.id !== 'string' ||
        typeof payload.name !== 'string' ||
        typeof payload.email !== 'string' ||
        typeof payload.role !== 'string'
      ) {
        return null;
      }
      return {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        codeforcesHandle:
          typeof payload.codeforcesHandle === 'string' ? payload.codeforcesHandle : null,
      };
    } catch {
      return null;
    }
  }

  async getCurrentUser(userId: string): Promise<UserPayload | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      codeforcesHandle: user.codeforcesHandle,
    };
  }
}

export const authService = new AuthService();
