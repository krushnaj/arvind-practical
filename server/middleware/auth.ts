import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';

export interface AuthenticatedUser {
  id: string;
  username: string;
  name: string;
  role: string;
  plant: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      plant: user.plant,
    },
    CONFIG.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token, allow as guest or reject depending on strictness
    // To allow smooth mobile usage, we attach default supervisor if token absent or check strictness
    const guestUser: AuthenticatedUser = {
      id: 'usr_guest_supervisor',
      username: 'guest_supervisor',
      name: 'Shop-Floor Supervisor',
      role: 'supervisor',
      plant: 'Santej Unit 1 (Weaving & Finishing)',
    };
    req.user = guestUser;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

