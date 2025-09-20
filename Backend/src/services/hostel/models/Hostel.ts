import mongoose, { Schema, Document } from 'mongoose';
import { Hostel as HostelInterface } from '../../../types';

export interface HostelDocument extends Omit<HostelInterface, '_id'>, Document {}

const contactInfoSchema = new Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number'],
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
}, {
  _id: false,
});

const hostelSchema = new Schema<HostelDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Hostel name must be at least 2 characters'],
    maxlength: [100, 'Hostel name cannot exceed 100 characters'],
  },
  campus: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Campus is required'],
  },
  address: {
    type: String,
    required: true,
    trim: true,
    minlength: [10, 'Address must be at least 10 characters'],
    maxlength: [500, 'Address cannot exceed 500 characters'],
  },
  amenities: [{
    type: String,
    trim: true,
  }],
  contactInfo: {
    type: contactInfoSchema,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1'],
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
hostelSchema.index({ name: 1 });
hostelSchema.index({ campus: 1 });
hostelSchema.index({ isActive: 1 });
hostelSchema.index({ createdAt: -1 });

// Compound indexes
hostelSchema.index({ campus: 1, isActive: 1 });
hostelSchema.index({ name: 1, campus: 1 });

// Text search index
hostelSchema.index({ name: 'text', campus: 'text', address: 'text' });

// Pre-save middleware
hostelSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  if (this.isModified('campus')) {
    this.campus = this.campus.trim();
  }
  if (this.isModified('address')) {
    this.address = this.address.trim();
  }
  next();
});

// Static methods
hostelSchema.statics.findByCampus = function(campus: string) {
  return this.find({ campus, isActive: true }).maxTimeMS(60000);
};

hostelSchema.statics.findActive = function() {
  return this.find({ isActive: true }).maxTimeMS(60000);
};

hostelSchema.statics.searchHostels = function(searchTerm: string) {
  return this.find(
    { 
      $text: { $search: searchTerm },
      isActive: true 
    },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } }).maxTimeMS(60000);
};

hostelSchema.statics.findByAmenity = function(amenity: string) {
  return this.find({ 
    amenities: { $in: [amenity] },
    isActive: true 
  }).maxTimeMS(60000);
};

// Instance methods
hostelSchema.methods.addAmenity = function(amenity: string) {
  if (!this.amenities.includes(amenity)) {
    this.amenities.push(amenity);
  }
  return this.save({ maxTimeMS: 60000 });
};

hostelSchema.methods.removeAmenity = function(amenity: string) {
  this.amenities = this.amenities.filter((a: any) => a !== amenity);
  return this.save({ maxTimeMS: 60000 });
};

hostelSchema.methods.activate = function() {
  this.isActive = true;
  return this.save({ maxTimeMS: 60000 });
};

hostelSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save({ maxTimeMS: 60000 });
};

export const Hostel = mongoose.model<HostelDocument>('Hostel', hostelSchema);

// Function to get Hostel model with specific connection
export const getHostelModel = (connection: mongoose.Connection) => {
  return connection.model<HostelDocument>('Hostel', hostelSchema);
};

};

export const Hostel = mongoose.model<HostelDocument>('Hostel', hostelSchema);

// Function to get Hostel model with specific connection
export const getHostelModel = (connection: mongoose.Connection) => {
  return connection.model<HostelDocument>('Hostel', hostelSchema);
};
