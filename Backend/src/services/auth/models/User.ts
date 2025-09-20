import mongoose, { Schema, Document, Model } from 'mongoose';
import { User as UserInterface } from '../../../types';

export interface UserDocument extends Omit<UserInterface, '_id'>, Document {
  _id: string;
  _password?: string;
  updateLastLogin(): Promise<UserDocument>;
  activate(): Promise<UserDocument>;
  deactivate(): Promise<UserDocument>;
}

export interface UserModel extends Model<UserDocument> {
  findByEmail(email: string): Promise<UserDocument | null>;
  findByPhone(phone: string): Promise<UserDocument | null>;
  findActiveUsers(): Promise<UserDocument[]>;
  findByRole(role: string): Promise<UserDocument[]>;
}

const userSchema = new Schema<UserDocument>({
  role: {
    type: String,
    enum: ['STUDENT', 'ADMIN', 'STAFF'],
    required: true,
    default: 'STUDENT',
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number'],
  },
  passwordHash: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [100, 'Full name cannot exceed 100 characters'],
  },
  firstName: {
    type: String,
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
  },
  firebaseUid: {
    type: String,
    sparse: true,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete (ret as any).passwordHash;
      return ret;
    },
  },
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Compound indexes
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });

// Virtual for password (not stored in DB)
userSchema.virtual('password')
  .set(function(this: any, password: string) {
    // This will be handled by the service layer
    this._password = password;
  })
  .get(function(this: any) {
    return this._password;
  });

// Pre-save middleware
userSchema.pre('save', function(this: any, next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Static methods
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true })
    .maxTimeMS(30000); // 30 second timeout
};

userSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ phone, isActive: true })
    .maxTimeMS(30000); // 30 second timeout
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true })
    .maxTimeMS(30000); // 30 second timeout
};

userSchema.statics.findByRole = function(role: string) {
  return this.find({ role, isActive: true })
    .maxTimeMS(30000); // 30 second timeout
};

// Instance methods
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save({ maxTimeMS: 30000 });
};

userSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save({ maxTimeMS: 30000 });
};

userSchema.methods.activate = function() {
  this.isActive = true;
  return this.save({ maxTimeMS: 30000 });
};

// Function to get User model with specific connection
export const getUserModel = (connection: mongoose.Connection) => {
  return connection.model<UserDocument, UserModel>('User', userSchema);
};

// Default export for backward compatibility (uses default connection)
export const User = mongoose.model<UserDocument, UserModel>('User', userSchema);
