import { Request, Response, NextFunction } from 'express';
import { authService, UserPayload } from './auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.substring(7);
  const user = authService.verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  if (user.role !== 'teacher' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions.' });
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = authService.verifyToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}
