import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import { JWTPayload, User } from '../../types';

export class JWTService {
  private static instance: JWTService;

  private constructor() {}

  public static getInstance(): JWTService {
    if (!JWTService.instance) {
      JWTService.instance = new JWTService();
    }
    return JWTService.instance;
  }

  public generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'hostel-management',
      audience: 'hostel-management-api',
    });
  }

  public generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      config.jwt.refreshSecret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: 'hostel-management',
        audience: 'hostel-management-api',
      }
    );
  }

  public generatePasswordResetToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'password_reset' },
      config.jwt.secret,
      {
        expiresIn: '1h',
        issuer: 'hostel-management',
        audience: 'hostel-management-api',
      }
    );
  }

  public verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'hostel-management',
        audience: 'hostel-management-api',
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  public verifyRefreshToken(token: string): { userId: string; type: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'hostel-management',
        audience: 'hostel-management-api',
      }) as { userId: string; type: string };
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  public hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  public comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public extractTokenFromHeader(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }
    
    return authHeader.substring(7);
  }

  public isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }
}

export const jwtService = JWTService.getInstance();
