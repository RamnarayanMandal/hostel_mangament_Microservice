import { Router } from 'express';
import { 
  register, 
  signup, 
  login, 
  getProfile, 
  updateProfile,
  logout,
  verifyEmailOTP,
  resendEmailOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  firebaseSignup,
  firebaseLogin
} from '../controllers/AuthController';
import { 
  validateRequest, 
  createUserSchema, 
  loginSchema,
  signupSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  firebaseAuthSchema
} from '../../../shared/utils/validation';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

// Public routes
router.post('/register', validateRequest(createUserSchema), register);
router.post('/signup', validateRequest(signupSchema), signup);
router.post('/login', validateRequest(loginSchema), login);
router.post('/verify-email-otp', validateRequest(verifyOTPSchema), verifyEmailOTP);
router.post('/resend-email-otp', validateRequest(forgotPasswordSchema), resendEmailOTP);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);

// Firebase auth routes
router.post('/firebase/signup', validateRequest(firebaseAuthSchema), firebaseSignup);
router.post('/firebase/login', validateRequest(firebaseAuthSchema), firebaseLogin);

// Protected routes
router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', validateRequest(updateProfileSchema), updateProfile);
router.put('/change-password', validateRequest(changePasswordSchema), changePassword);
router.post('/logout', logout);

export default router;
