import mongoose, { Schema, Document } from 'mongoose';
import { Bed as BedInterface } from '../../../types';

export interface BedDocument extends Omit<BedInterface, '_id'>, Document {}

const bedSchema = new Schema<BedDocument>({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  bedNo: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Bed number is required'],
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'ON_HOLD', 'ALLOCATED', 'BLOCKED'],
    default: 'AVAILABLE',
  },
  occupantBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
  },
  holdExpiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
bedSchema.index({ roomId: 1 });
bedSchema.index({ bedNo: 1 });
bedSchema.index({ status: 1 });
bedSchema.index({ occupantBookingId: 1 });
bedSchema.index({ holdExpiresAt: 1 });
bedSchema.index({ createdAt: -1 });

// Compound indexes
bedSchema.index({ roomId: 1, bedNo: 1 }, { unique: true });
bedSchema.index({ roomId: 1, status: 1 });
bedSchema.index({ status: 1, holdExpiresAt: 1 });

// TTL index for expired holds
bedSchema.index({ holdExpiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware
bedSchema.pre('save', function(next) {
  if (this.isModified('bedNo')) {
    this.bedNo = this.bedNo.trim();
  }
  next();
});

// Static methods
bedSchema.statics.findByRoom = function(roomId: string) {
  return this.find({ roomId }).sort({ bedNo: 1 });
};

bedSchema.statics.findAvailableBeds = function(roomId: string) {
  return this.find({ roomId, status: 'AVAILABLE' }).sort({ bedNo: 1 });
};

bedSchema.statics.findByStatus = function(roomId: string, status: string) {
  return this.find({ roomId, status });
};

bedSchema.statics.findByBooking = function(bookingId: string) {
  return this.findOne({ occupantBookingId: bookingId });
};

bedSchema.statics.findExpiredHolds = function() {
  return this.find({
    status: 'ON_HOLD',
    holdExpiresAt: { $lt: new Date() }
  });
};

bedSchema.statics.findByRoomAndBedNo = function(roomId: string, bedNo: string) {
  return this.findOne({ roomId, bedNo });
};

// Instance methods
bedSchema.methods.hold = function(bookingId: string, ttlSeconds: number = 300) {
  this.status = 'ON_HOLD';
  this.occupantBookingId = bookingId;
  this.holdExpiresAt = new Date(Date.now() + ttlSeconds * 1000);
  return this.save();
};

bedSchema.methods.allocate = function(bookingId: string) {
  this.status = 'ALLOCATED';
  this.occupantBookingId = bookingId;
  this.holdExpiresAt = undefined;
  return this.save();
};

bedSchema.methods.release = function() {
  this.status = 'AVAILABLE';
  this.occupantBookingId = undefined;
  this.holdExpiresAt = undefined;
  return this.save();
};

bedSchema.methods.block = function() {
  this.status = 'BLOCKED';
  this.occupantBookingId = undefined;
  this.holdExpiresAt = undefined;
  return this.save();
};

bedSchema.methods.extendHold = function(ttlSeconds: number = 300) {
  if (this.status === 'ON_HOLD') {
    this.holdExpiresAt = new Date(Date.now() + ttlSeconds * 1000);
  }
  return this.save();
};

// Aggregation methods
bedSchema.statics.getBedStatistics = function(roomId: string) {
  return this.aggregate([
    { $match: { roomId: new mongoose.Types.ObjectId(roomId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

bedSchema.statics.getHostelBedStatistics = function(hostelId: string) {
  return this.aggregate([
    {
      $lookup: {
        from: 'rooms',
        localField: 'roomId',
        foreignField: '_id',
        as: 'room'
      }
    },
    { $unwind: '$room' },
    { $match: { 'room.hostelId': new mongoose.Types.ObjectId(hostelId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

export const Bed = mongoose.model<BedDocument>('Bed', bedSchema);
