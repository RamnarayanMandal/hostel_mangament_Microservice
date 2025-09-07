import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { CreateUserInput, LoginInput } from '../../../shared/utils/validation';
import { asyncHandler } from '../../../shared/utils/errors';
import { authLogger } from '../../../shared/utils/logger';

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user with enhanced fields
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - phoneNumber
 *               - gender
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password
 *               confirmPassword:
 *                 type: string
 *                 description: Password confirmation
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: User's gender
 *               role:
 *                 type: string
 *                 enum: [STUDENT, ADMIN, STAFF]
 *                 default: STUDENT
 *                 description: User's role
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: User already exists
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const userData = req.body;
  
  const result = await authService.signup(userData);
  
  authLogger.logger.info('User signed up successfully', { 
    userId: result._id, 
    email: result.email 
  });
  
  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please verify your email.',
    data: result
  });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *       401:
 *         description: Invalid credentials
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const loginData: LoginInput = req.body;
  
  const result = await authService.login(loginData);
  
  authLogger.logger.info('User logged in successfully', { 
    userId: result.user._id, 
    email: result.user.email 
  });
  
  res.status(200).json({
    success: true,
    data: result.user,
    token: result.accessToken
  });
});

/**
 * @swagger
 * /auth/verify-email-otp:
 *   post:
 *     summary: Verify email OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - email
 *             properties:
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP code
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid OTP
 */
export const verifyEmailOTP = asyncHandler(async (req: Request, res: Response) => {
  const { otp, email } = req.body;
  
  const result = await authService.verifyEmailOTP(otp, email);
  
  authLogger.logger.info('Email OTP verified successfully', { email });
  
  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now login.',
    data: result
  });
});

/**
 * @swagger
 * /auth/resend-email-otp:
 *   post:
 *     summary: Resend email OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Invalid email
 */
export const resendEmailOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  await authService.resendEmailOTP(email);
  
  authLogger.logger.info('Email OTP resent successfully', { email });
  
  res.status(200).json({
    success: true,
    message: 'OTP has been resent to your email.'
  });
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  await authService.forgotPassword(email);
  
  authLogger.logger.info('Password reset email sent', { email });
  
  res.status(200).json({
    success: true,
    message: 'Password reset instructions have been sent to your email.'
  });
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Confirm new password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  
  await authService.resetPasswordWithToken(token, password);
  
  authLogger.logger.info('Password reset successfully');
  
  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully. You can now login with your new password.'
  });
});

/**
 * @swagger
 * /firebase/signup:
 *   post:
 *     summary: Firebase signup
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token
 *     responses:
 *       200:
 *         description: Firebase signup successful
 *       400:
 *         description: Invalid token
 */
export const firebaseSignup = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  
  const result = await authService.firebaseSignup(idToken);
  
  authLogger.logger.info('Firebase signup successful', { 
    userId: result.user._id, 
    email: result.user.email 
  });
  
  res.status(200).json({
    success: true,
    data: result.user,
    token: result.accessToken
  });
});

/**
 * @swagger
 * /firebase/login:
 *   post:
 *     summary: Firebase login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token
 *     responses:
 *       200:
 *         description: Firebase login successful
 *       400:
 *         description: Invalid token
 */
export const firebaseLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  
  const result = await authService.firebaseLogin(idToken);
  
  authLogger.logger.info('Firebase login successful', { 
    userId: result.user._id, 
    email: result.user.email 
  });
  
  res.status(200).json({
    success: true,
    data: result.user,
    token: result.accessToken
  });
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  const user = await authService.getUserById(userId);
  
  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const updateData = req.body;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  const user = await authService.updateProfile(userId, updateData);
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized or invalid current password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  await authService.changePassword(userId, currentPassword, newPassword);
  
  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // In a real implementation, you might want to blacklist the token
  // For now, we'll just return a success response
  
  authLogger.logger.info('User logged out', { 
    userId: req.user?.id 
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Legacy register endpoint for backward compatibility
export const register = asyncHandler(async (req: Request, res: Response) => {
  const userData: CreateUserInput = req.body;
  
  const result = await authService.registerUser(userData);
  
  authLogger.logger.info('User registered successfully', { 
    userId: result._id, 
    email: result.email 
  });
  
  res.status(201).json({
    success: true,
    data: result
  });
});
