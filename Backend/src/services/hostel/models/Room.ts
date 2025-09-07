import mongoose, { Schema, Document } from 'mongoose';
import { Room as RoomInterface } from '../../../types';

export interface RoomDocument extends Omit<RoomInterface, '_id'>, Document {}

const roomSchema = new Schema<RoomDocument>({
  hostelId: {
    type: Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  number: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Room number is required'],
  },
  type: {
    type: String,
    required: true,
    enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM'],
  },
  genderPolicy: {
    type: String,
    enum: ['MALE', 'FEMALE', 'ANY'],
  },
  priceTier: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['OPEN', 'MAINTENANCE', 'BLOCKED'],
    default: 'OPEN',
  },
  floor: {
    type: Number,
    required: true,
    min: [0, 'Floor cannot be negative'],
  },
  block: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes
roomSchema.index({ hostelId: 1 });
roomSchema.index({ number: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ floor: 1 });
roomSchema.index({ createdAt: -1 });

// Compound indexes
roomSchema.index({ hostelId: 1, number: 1 }, { unique: true });
roomSchema.index({ hostelId: 1, type: 1 });
roomSchema.index({ hostelId: 1, status: 1 });
roomSchema.index({ hostelId: 1, floor: 1 });
roomSchema.index({ hostelId: 1, genderPolicy: 1 });
roomSchema.index({ type: 1, status: 1 });
roomSchema.index({ hostelId: 1, type: 1, status: 1 });

// Pre-save middleware
roomSchema.pre('save', function(next) {
  if (this.isModified('number')) {
    this.number = this.number.trim();
  }
  if (this.isModified('block')) {
    this.block = this.block?.trim();
  }
  next();
});

// Static methods
roomSchema.statics.findByHostel = function(hostelId: string) {
  return this.find({ hostelId }).sort({ floor: 1, number: 1 });
};

roomSchema.statics.findByHostelAndType = function(hostelId: string, type: string) {
  return this.find({ hostelId, type, status: 'OPEN' });
};

roomSchema.statics.findByHostelAndStatus = function(hostelId: string, status: string) {
  return this.find({ hostelId, status });
};

roomSchema.statics.findAvailableRooms = function(hostelId: string, type?: string) {
  const query: any = { hostelId, status: 'OPEN' };
  if (type) query.type = type;
  return this.find(query).sort({ floor: 1, number: 1 });
};

roomSchema.statics.findByFloor = function(hostelId: string, floor: number) {
  return this.find({ hostelId, floor }).sort({ number: 1 });
};

roomSchema.statics.findByGenderPolicy = function(hostelId: string, genderPolicy: string) {
  return this.find({ hostelId, genderPolicy, status: 'OPEN' });
};

// Instance methods
roomSchema.methods.setMaintenance = function() {
  this.status = 'MAINTENANCE';
  return this.save();
};

roomSchema.methods.setOpen = function() {
  this.status = 'OPEN';
  return this.save();
};

roomSchema.methods.setBlocked = function() {
  this.status = 'BLOCKED';
  return this.save();
};

roomSchema.methods.updatePriceTier = function(priceTier: string) {
  this.priceTier = priceTier;
  return this.save();
};

export const Room = mongoose.model<RoomDocument>('Room', roomSchema);
