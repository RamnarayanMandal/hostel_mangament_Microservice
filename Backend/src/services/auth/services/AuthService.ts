import { User as UserModel, UserDocument } from '../models/User';
import { jwtService } from '../../../shared/utils/jwt';
import { 
  UpdateUserInput, 
  LoginInput,
  CreateUserInput as CreateUserInputType,
  SignupInput
} from '../../../shared/utils/validation';
import { 
  AuthenticationError, 
  ConflictError, 
  NotFoundError,
  ValidationError 
} from '../../../shared/utils/errors';
import { getMessageBroker, EVENT_TYPES } from '../../../shared/config/message-broker';
import { authLogger } from '../../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { getRedisConnection } from '../../../shared/config/redis';
import { emailService } from '../../../shared/services/emailService';
import { admin } from '../../../shared/config/firebase';

export class AuthService {
  private messageBroker = getMessageBroker();
  private redis: any;

  constructor() {
    this.initializeRedis();
  }

  // Helper function to handle errors properly
  private handleError(error: unknown, context: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    authLogger.logger.error(`${context} failed`, { error: errorMessage });
    throw error;
  }

  private async initializeRedis() {
    this.redis = await getRedisConnection();
  }

 

  /**
   * Enhanced signup with OTP verification
   */
  public async signup(userData: SignupInput): Promise<UserDocument> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Validate password confirmation
      if (userData.password !== userData.confirmPassword) {
        throw new ValidationError('Passwords do not match');
      }

      // Hash password
      const passwordHash = await jwtService.hashPassword(userData.password);

      // Create user with enhanced fields
      const user = new UserModel({
        email: userData.email,
        passwordHash,
        fullName: `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phoneNumber,
        gender: userData.gender,
        role: userData.role || 'STUDENT',
        isEmailVerified: false,
        isActive: true,
      });

      await user.save();

      // Generate and send OTP
      const otp = this.generateOTP();
      await this.storeOTP(userData.email, otp);
      await this.sendEmailOTP(userData.email, otp);

      // Publish user created event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.STUDENT_CREATED,
        service: 'auth-service',
        data: {
          userId: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
        timestamp: new Date(),
      });

      authLogger.logger.info('User signed up successfully', { userId: user._id, email: user.email });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      authLogger.logger.error('Failed to sign up user', { error: errorMessage, email: userData.email });
      throw error;
    }
  }

  /**
   * Register a new user (legacy method)
   */
  public async registerUser(userData: CreateUserInputType): Promise<UserDocument> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await jwtService.hashPassword(userData.password);

      // Create user
      const user = new UserModel({
        ...userData,
        passwordHash,
      });

      await user.save();

      // Publish user created event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.STUDENT_CREATED,
        service: 'auth-service',
        data: {
          userId: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
        timestamp: new Date(),
      });

      authLogger.logger.info('User registered successfully', { userId: user._id, email: user.email });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      authLogger.logger.error('Failed to register user', { error: errorMessage, email: userData.email });
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  public async login(loginData: LoginInput): Promise<{
    user: UserDocument;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Find user by email
      const user = await UserModel.findByEmail(loginData.email);
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        throw new AuthenticationError('Please verify your email before logging in');
      }

      // Verify password
      const isPasswordValid = await jwtService.comparePassword(loginData.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
      const accessToken = jwtService.generateAccessToken({
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      });

      const refreshToken = jwtService.generateRefreshToken(user._id.toString());

      authLogger.logger.info('User logged in successfully', { userId: user._id, email: user.email });
      
      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      authLogger.logger.error('Login failed', { error: errorMessage, email: loginData.email });
      throw error;
    }
  }

  /**
   * Verify email OTP
   */
  public async verifyEmailOTP(otp: string, email: string): Promise<UserDocument> {
    try {
      // Get stored OTP
      const storedOTP = await this.getStoredOTP(email);
      if (!storedOTP || storedOTP !== otp) {
        throw new ValidationError('Invalid OTP');
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Mark email as verified
      user.isEmailVerified = true;
      await user.save();

      // Clear OTP from Redis
      await this.clearOTP(email);

      authLogger.logger.info('Email OTP verified successfully', { userId: user._id, email });
      return user;
    } catch (error: any) {
      authLogger.logger.error('Email OTP verification failed', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Resend email OTP
   */
  public async resendEmailOTP(email: string): Promise<void> {
    try {
      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Generate new OTP
      const otp = this.generateOTP();
      await this.storeOTP(email, otp);
      await this.sendEmailOTP(email, otp);

      authLogger.logger.info('Email OTP resent successfully', { userId: user._id, email });
    } catch (error: any) {
      authLogger.logger.error('Failed to resend email OTP', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Forgot password
   */
  public async forgotPassword(email: string): Promise<void> {
    try {
      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Generate reset token
      const resetToken = jwtService.generatePasswordResetToken(user._id.toString());
      
      // Store reset token in Redis with expiration (1 hour)
      await this.redis.setex(`password_reset:${resetToken}`, 3600, user._id.toString());

      // Send password reset email
      await this.sendPasswordResetEmail(email, resetToken);

      authLogger.logger.info('Password reset email sent', { userId: user._id, email });
    } catch (error: any) {
      authLogger.logger.error('Failed to send password reset email', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  public async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    try {
      // Get user ID from Redis
      const userId = await this.redis.get(`password_reset:${token}`);
      if (!userId) {
        throw new ValidationError('Invalid or expired reset token');
      }

      // Find user
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Hash new password
      const newPasswordHash = await jwtService.hashPassword(newPassword);

      // Update password
      user.passwordHash = newPasswordHash;
      await user.save();

      // Clear reset token from Redis
      await this.redis.del(`password_reset:${token}`);

      authLogger.logger.info('Password reset successfully', { userId: user._id });
    } catch (error: any) {
      authLogger.logger.error('Failed to reset password', { error: error.message });
      throw error;
    }
  }

  /**
   * Firebase signup
   */
  public async firebaseSignup(idToken: string): Promise<{
    user: UserDocument;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Check if Firebase is configured
      if (!admin.apps.length) {
        throw new AuthenticationError('Firebase authentication is not configured');
      }

      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Check if user already exists
      let user = await UserModel.findByEmail(decodedToken.email!);
      
      if (!user) {
        // Create new user from Firebase data
        user = new UserModel({
          email: decodedToken.email!,
          fullName: decodedToken.name || 'Firebase User',
          firstName: decodedToken.name?.split(' ')[0] || 'Firebase',
          lastName: decodedToken.name?.split(' ').slice(1).join(' ') || 'User',
          role: 'STUDENT',
          isEmailVerified: decodedToken.email_verified || false,
          isActive: true,
          firebaseUid: decodedToken.uid,
        });

        await user.save();

        // Publish user created event
        await this.messageBroker.publishEvent({
          id: uuidv4(),
          type: EVENT_TYPES.STUDENT_CREATED,
          service: 'auth-service',
          data: {
            userId: user._id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
          },
          timestamp: new Date(),
        });
      }

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
      const accessToken = jwtService.generateAccessToken({
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      });

      const refreshToken = jwtService.generateRefreshToken(user._id.toString());

      authLogger.logger.info('Firebase signup successful', { userId: user._id, email: user.email });
      
      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      authLogger.logger.error('Firebase signup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Firebase login
   */
  public async firebaseLogin(idToken: string): Promise<{
    user: UserDocument;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Check if Firebase is configured
      if (!admin.apps.length) {
        throw new AuthenticationError('Firebase authentication is not configured');
      }

      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Find user
      const user = await UserModel.findByEmail(decodedToken.email!);
      if (!user) {
        throw new AuthenticationError('User not found. Please sign up first.');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
      const accessToken = jwtService.generateAccessToken({
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      });

      const refreshToken = jwtService.generateRefreshToken(user._id.toString());

      authLogger.logger.info('Firebase login successful', { userId: user._id, email: user.email });
      
      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      authLogger.logger.error('Firebase login failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(userId: string, updateData: any): Promise<UserDocument> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Update allowed fields
      const allowedFields = ['firstName', 'lastName', 'phone', 'gender'];
      const updateFields: any = {};

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });

      // Update fullName if firstName or lastName changed
      if (updateFields.firstName || updateFields.lastName) {
        const firstName = updateFields.firstName || user.firstName;
        const lastName = updateFields.lastName || user.lastName;
        updateFields.fullName = `${firstName} ${lastName}`;
      }

      // Update phone field mapping
      if (updateFields.phone) {
        updateFields.phone = updateFields.phone;
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }

      // Publish user updated event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.STUDENT_UPDATED,
        service: 'auth-service',
        data: {
          userId: updatedUser._id,
          email: updatedUser.email,
          role: updatedUser.role,
          fullName: updatedUser.fullName,
          isActive: updatedUser.isActive,
        },
        timestamp: new Date(),
      });

      authLogger.logger.info('User profile updated successfully', { userId: updatedUser._id });
      return updatedUser;
    } catch (error) {
      this.handleError(error, 'Update user profile');
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const decoded = jwtService.verifyRefreshToken(refreshToken);
      
      // Find user
      const user = await UserModel.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = jwtService.generateAccessToken({
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      });

      const newRefreshToken = jwtService.generateRefreshToken(user._id.toString());

      authLogger.logger.info('Token refreshed successfully', { userId: user._id });
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.handleError(error, 'Token refresh');
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(userId: string): Promise<UserDocument> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return user;
      } catch (error: any) {
      authLogger.logger.error('Failed to get user by ID', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Update user
   */
  public async updateUser(userId: string, updateData: UpdateUserInput): Promise<UserDocument> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Publish user updated event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.STUDENT_UPDATED,
        service: 'auth-service',
        data: {
          userId: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          isActive: user.isActive,
        },
        timestamp: new Date(),
      });

      authLogger.logger.info('User updated successfully', { userId: user._id });
      return user;
    } catch (error: any) {
      authLogger.logger.error('Failed to update user', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  public async deactivateUser(userId: string): Promise<UserDocument> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.deactivate();

      authLogger.logger.info('User deactivated successfully', { userId: user._id });
      return user;
    } catch (error: any) {
      authLogger.logger.error('Failed to deactivate user', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Activate user
   */
  public async activateUser(userId: string): Promise<UserDocument> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.activate();

      authLogger.logger.info('User activated successfully', { userId: user._id });
      return user;
    } catch (error: any) {
      authLogger.logger.error('Failed to activate user', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get all users with pagination
   */
  public async getUsers(page: number = 1, limit: number = 10, filters: any = {}): Promise<{
    users: UserDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build query
      const query: any = {};
      if (filters.role) query.role = filters.role;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.search) {
        query.$or = [
          { email: { $regex: filters.search, $options: 'i' } },
          { fullName: { $regex: filters.search, $options: 'i' } },
        ];
      }

      const [users, total] = await Promise.all([
        UserModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        UserModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error: any) {
      authLogger.logger.error('Failed to get users', { error: error.message });
      throw error;
    }
  }

  /**
   * Change user password
   */
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await jwtService.comparePassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await jwtService.hashPassword(newPassword);

      // Update password
      user.passwordHash = newPasswordHash;
      await user.save();

      authLogger.logger.info('Password changed successfully', { userId: user._id });
    } catch (error: any) {
      authLogger.logger.error('Failed to change password', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Reset password (admin function)
   */
  public async resetPassword(userId: string, newPassword: string): Promise<void> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Hash new password
      const newPasswordHash = await jwtService.hashPassword(newPassword);

      // Update password
      user.passwordHash = newPasswordHash;
      await user.save();

      authLogger.logger.info('Password reset successfully', { userId: user._id });
    } catch (error: any) {
      authLogger.logger.error('Failed to reset password', { error: error.message, userId });
      throw error;
    }
  }

  // Private helper methods

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP in Redis
   */
  private async storeOTP(email: string, otp: string): Promise<void> {
    const key = `email_otp:${email}`;
    await this.redis.setex(key, 300, otp); // 5 minutes expiration
  }

  /**
   * Get stored OTP from Redis
   */
  private async getStoredOTP(email: string): Promise<string | null> {
    const key = `email_otp:${email}`;
    return await this.redis.get(key);
  }

  /**
   * Clear OTP from Redis
   */
  private async clearOTP(email: string): Promise<void> {
    const key = `email_otp:${email}`;
    await this.redis.del(key);
  }

  /**
   * Send email OTP
   */
  private async sendEmailOTP(email: string, otp: string): Promise<void> {
    const subject = 'Email Verification OTP';
    const html = `
      <h2>Email Verification</h2>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `;

    await emailService.sendEmail(email, subject, html);
  }

  /**
   * Send password reset email
   */
  private async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
    `;

    await emailService.sendEmail(email, subject, html);
  }
}

export const authService = new AuthService();
