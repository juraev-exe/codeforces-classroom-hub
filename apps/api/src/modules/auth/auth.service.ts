import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@cf-hub/database';

const JWT_SECRET = process.env.JWT_SECRET || 'cf_classroom_jwt_secret_2026_dev_key';

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
      return jwt.verify(token, JWT_SECRET) as UserPayload;
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
