import { Hostel, HostelDocument } from '../models/Hostel';
import { Room, RoomDocument } from '../models/Room';
import { Bed, BedDocument } from '../models/Bed';
import { 
  CreateHostelInput, 
  UpdateHostelInput,
  CreateRoomInput,
  UpdateRoomInput,
  CreateBedInput,
  UpdateBedInput
} from '../../../shared/utils/validation';
import { 
  ConflictError, 
  NotFoundError, 
  ValidationError 
} from '../../../shared/utils/errors';
import { getMessageBroker, EVENT_TYPES } from '../../../shared/config/message-broker';
import { hostelLogger } from '../../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class HostelService {
  private messageBroker = getMessageBroker();

  // Hostel Management
  /**
   * Create a new hostel
   */
  public async createHostel(hostelData: CreateHostelInput): Promise<HostelDocument> {
    try {
      // Check if hostel with same name in same campus already exists
      const existingHostel = await Hostel.findOne({
        name: hostelData.name,
        campus: hostelData.campus,
      });
      
      if (existingHostel) {
        throw new ConflictError('Hostel with this name already exists in the campus');
      }

      const hostel = new Hostel(hostelData);
      await hostel.save();

      // Publish hostel created event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.HOSTEL_CREATED,
        service: 'hostel-service',
        data: {
          hostelId: hostel._id,
          name: hostel.name,
          campus: hostel.campus,
          capacity: hostel.capacity,
        },
        timestamp: new Date(),
      });

      hostelLogger.logger.info('Hostel created successfully', { 
        hostelId: hostel._id, 
        name: hostel.name 
      });
      
      return hostel;
    } catch (error) {
      hostelLogger.logger.error('Failed to create hostel', { error: error.message });
      throw error;
    }
  }

  /**
   * Get hostel by ID
   */
  public async getHostelById(hostelId: string): Promise<HostelDocument> {
    try {
      const hostel = await Hostel.findById(hostelId);
      if (!hostel) {
        throw new NotFoundError('Hostel');
      }
      return hostel;
    } catch (error) {
      hostelLogger.logger.error('Failed to get hostel by ID', { error: error.message, hostelId });
      throw error;
    }
  }

  /**
   * Update hostel
   */
  public async updateHostel(hostelId: string, updateData: UpdateHostelInput): Promise<HostelDocument> {
    try {
      const hostel = await Hostel.findByIdAndUpdate(
        hostelId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!hostel) {
        throw new NotFoundError('Hostel');
      }

      // Publish hostel updated event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.HOSTEL_UPDATED,
        service: 'hostel-service',
        data: {
          hostelId: hostel._id,
          name: hostel.name,
          campus: hostel.campus,
          capacity: hostel.capacity,
          isActive: hostel.isActive,
        },
        timestamp: new Date(),
      });

      hostelLogger.logger.info('Hostel updated successfully', { hostelId: hostel._id });
      return hostel;
    } catch (error) {
      hostelLogger.logger.error('Failed to update hostel', { error: error.message, hostelId });
      throw error;
    }
  }

  /**
   * Get all hostels with pagination and filters
   */
  public async getHostels(page: number = 1, limit: number = 10, filters: any = {}): Promise<{
    hostels: HostelDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build query
      const query: any = {};
      if (filters.campus) query.campus = filters.campus;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.amenities && filters.amenities.length > 0) {
        query.amenities = { $in: filters.amenities };
      }
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      const [hostels, total] = await Promise.all([
        Hostel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Hostel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        hostels,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      hostelLogger.logger.error('Failed to get hostels', { error: error.message });
      throw error;
    }
  }

  /**
   * Search hostels
   */
  public async searchHostels(searchTerm: string): Promise<HostelDocument[]> {
    try {
      const hostels = await Hostel.searchHostels(searchTerm);
      return hostels;
    } catch (error) {
      hostelLogger.logger.error('Failed to search hostels', { error: error.message, searchTerm });
      throw error;
    }
  }

  /**
   * Get hostels by campus
   */
  public async getHostelsByCampus(campus: string): Promise<HostelDocument[]> {
    try {
      const hostels = await Hostel.findByCampus(campus);
      return hostels;
    } catch (error) {
      hostelLogger.logger.error('Failed to get hostels by campus', { error: error.message, campus });
      throw error;
    }
  }

  /**
   * Get hostels by amenity
   */
  public async getHostelsByAmenity(amenity: string): Promise<HostelDocument[]> {
    try {
      const hostels = await Hostel.findByAmenity(amenity);
      return hostels;
    } catch (error) {
      hostelLogger.logger.error('Failed to get hostels by amenity', { error: error.message, amenity });
      throw error;
    }
  }

  // Room Management
  /**
   * Create a new room
   */
  public async createRoom(roomData: CreateRoomInput): Promise<RoomDocument> {
    try {
      // Verify hostel exists
      const hostel = await Hostel.findById(roomData.hostelId);
      if (!hostel) {
        throw new NotFoundError('Hostel');
      }

      // Check if room number already exists in the hostel
      const existingRoom = await Room.findByRoomAndBedNo(roomData.hostelId, roomData.number);
      if (existingRoom) {
        throw new ConflictError('Room number already exists in this hostel');
      }

      const room = new Room(roomData);
      await room.save();

      hostelLogger.logger.info('Room created successfully', { 
        roomId: room._id, 
        hostelId: room.hostelId,
        number: room.number 
      });
      
      return room;
    } catch (error) {
      hostelLogger.logger.error('Failed to create room', { error: error.message });
      throw error;
    }
  }

  /**
   * Get room by ID
   */
  public async getRoomById(roomId: string): Promise<RoomDocument> {
    try {
      const room = await Room.findById(roomId).populate('hostelId', 'name campus');
      if (!room) {
        throw new NotFoundError('Room');
      }
      return room;
    } catch (error) {
      hostelLogger.logger.error('Failed to get room by ID', { error: error.message, roomId });
      throw error;
    }
  }

  /**
   * Update room
   */
  public async updateRoom(roomId: string, updateData: UpdateRoomInput): Promise<RoomDocument> {
    try {
      const room = await Room.findByIdAndUpdate(
        roomId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('hostelId', 'name campus');

      if (!room) {
        throw new NotFoundError('Room');
      }

      hostelLogger.logger.info('Room updated successfully', { roomId: room._id });
      return room;
    } catch (error) {
      hostelLogger.logger.error('Failed to update room', { error: error.message, roomId });
      throw error;
    }
  }

  /**
   * Get rooms by hostel
   */
  public async getRoomsByHostel(hostelId: string, filters: any = {}): Promise<RoomDocument[]> {
    try {
      let query: any = { hostelId };
      
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.floor) query.floor = filters.floor;
      if (filters.genderPolicy) query.genderPolicy = filters.genderPolicy;

      const rooms = await Room.find(query).populate('hostelId', 'name campus');
      return rooms;
    } catch (error) {
      hostelLogger.logger.error('Failed to get rooms by hostel', { error: error.message, hostelId });
      throw error;
    }
  }

  /**
   * Get available rooms
   */
  public async getAvailableRooms(hostelId: string, type?: string): Promise<RoomDocument[]> {
    try {
      const rooms = await Room.findAvailableRooms(hostelId, type);
      return rooms;
    } catch (error) {
      hostelLogger.logger.error('Failed to get available rooms', { error: error.message, hostelId });
      throw error;
    }
  }

  // Bed Management
  /**
   * Create a new bed
   */
  public async createBed(bedData: CreateBedInput): Promise<BedDocument> {
    try {
      // Verify room exists
      const room = await Room.findById(bedData.roomId);
      if (!room) {
        throw new NotFoundError('Room');
      }

      // Check if bed number already exists in the room
      const existingBed = await Bed.findByRoomAndBedNo(bedData.roomId, bedData.bedNo);
      if (existingBed) {
        throw new ConflictError('Bed number already exists in this room');
      }

      const bed = new Bed(bedData);
      await bed.save();

      hostelLogger.logger.info('Bed created successfully', { 
        bedId: bed._id, 
        roomId: bed.roomId,
        bedNo: bed.bedNo 
      });
      
      return bed;
    } catch (error) {
      hostelLogger.logger.error('Failed to create bed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get bed by ID
   */
  public async getBedById(bedId: string): Promise<BedDocument> {
    try {
      const bed = await Bed.findById(bedId)
        .populate('roomId', 'number type hostelId')
        .populate('occupantBookingId', 'studentId status');
      
      if (!bed) {
        throw new NotFoundError('Bed');
      }
      return bed;
    } catch (error) {
      hostelLogger.logger.error('Failed to get bed by ID', { error: error.message, bedId });
      throw error;
    }
  }

  /**
   * Update bed
   */
  public async updateBed(bedId: string, updateData: UpdateBedInput): Promise<BedDocument> {
    try {
      const bed = await Bed.findByIdAndUpdate(
        bedId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('roomId', 'number type hostelId');

      if (!bed) {
        throw new NotFoundError('Bed');
      }

      hostelLogger.logger.info('Bed updated successfully', { bedId: bed._id });
      return bed;
    } catch (error) {
      hostelLogger.logger.error('Failed to update bed', { error: error.message, bedId });
      throw error;
    }
  }

  /**
   * Get beds by room
   */
  public async getBedsByRoom(roomId: string): Promise<BedDocument[]> {
    try {
      const beds = await Bed.findByRoom(roomId)
        .populate('occupantBookingId', 'studentId status');
      return beds;
    } catch (error) {
      hostelLogger.logger.error('Failed to get beds by room', { error: error.message, roomId });
      throw error;
    }
  }

  /**
   * Get available beds
   */
  public async getAvailableBeds(roomId: string): Promise<BedDocument[]> {
    try {
      const beds = await Bed.findAvailableBeds(roomId);
      return beds;
    } catch (error) {
      hostelLogger.logger.error('Failed to get available beds', { error: error.message, roomId });
      throw error;
    }
  }

  /**
   * Hold a bed
   */
  public async holdBed(bedId: string, bookingId: string, ttlSeconds: number = 300): Promise<BedDocument> {
    try {
      const bed = await Bed.findById(bedId);
      if (!bed) {
        throw new NotFoundError('Bed');
      }

      if (bed.status !== 'AVAILABLE') {
        throw new ValidationError('Bed is not available for holding');
      }

      await bed.hold(bookingId, ttlSeconds);

      // Publish bed held event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.BED_HELD,
        service: 'hostel-service',
        data: {
          bedId: bed._id,
          roomId: bed.roomId,
          bookingId,
          expiresAt: bed.holdExpiresAt,
        },
        timestamp: new Date(),
      });

      hostelLogger.logger.info('Bed held successfully', { bedId: bed._id, bookingId });
      return bed;
    } catch (error) {
      hostelLogger.logger.error('Failed to hold bed', { error: error.message, bedId });
      throw error;
    }
  }

  /**
   * Allocate a bed
   */
  public async allocateBed(bedId: string, bookingId: string): Promise<BedDocument> {
    try {
      const bed = await Bed.findById(bedId);
      if (!bed) {
        throw new NotFoundError('Bed');
      }

      if (bed.status !== 'ON_HOLD' && bed.status !== 'AVAILABLE') {
        throw new ValidationError('Bed is not available for allocation');
      }

      await bed.allocate(bookingId);

      // Publish bed allocated event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.BED_ALLOCATED,
        service: 'hostel-service',
        data: {
          bedId: bed._id,
          roomId: bed.roomId,
          bookingId,
        },
        timestamp: new Date(),
      });

      hostelLogger.logger.info('Bed allocated successfully', { bedId: bed._id, bookingId });
      return bed;
    } catch (error) {
      hostelLogger.logger.error('Failed to allocate bed', { error: error.message, bedId });
      throw error;
    }
  }

  /**
   * Release a bed
   */
  public async releaseBed(bedId: string): Promise<BedDocument> {
    try {
      const bed = await Bed.findById(bedId);
      if (!bed) {
        throw new NotFoundError('Bed');
      }

      await bed.release();

      // Publish bed released event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.BED_RELEASED,
        service: 'hostel-service',
        data: {
          bedId: bed._id,
          roomId: bed.roomId,
        },
        timestamp: new Date(),
      });

      hostelLogger.logger.info('Bed released successfully', { bedId: bed._id });
      return bed;
    } catch (error) {
      hostelLogger.logger.error('Failed to release bed', { error: error.message, bedId });
      throw error;
    }
  }

  /**
   * Get bed statistics
   */
  public async getBedStatistics(roomId: string): Promise<any> {
    try {
      const statistics = await Bed.getBedStatistics(roomId);
      return statistics;
    } catch (error) {
      hostelLogger.logger.error('Failed to get bed statistics', { error: error.message, roomId });
      throw error;
    }
  }

  /**
   * Get hostel bed statistics
   */
  public async getHostelBedStatistics(hostelId: string): Promise<any> {
    try {
      const statistics = await Bed.getHostelBedStatistics(hostelId);
      return statistics;
    } catch (error) {
      hostelLogger.logger.error('Failed to get hostel bed statistics', { error: error.message, hostelId });
      throw error;
    }
  }

  /**
   * Clean up expired holds
   */
  public async cleanupExpiredHolds(): Promise<void> {
    try {
      const expiredBeds = await Bed.findExpiredHolds();
      
      for (const bed of expiredBeds) {
        await bed.release();

        // Publish bed hold expired event
        await this.messageBroker.publishEvent({
          id: uuidv4(),
          type: EVENT_TYPES.BED_HOLD_EXPIRED,
          service: 'hostel-service',
          data: {
            bedId: bed._id,
            roomId: bed.roomId,
          },
          timestamp: new Date(),
        });
      }

      hostelLogger.logger.info('Cleaned up expired holds', { count: expiredBeds.length });
    } catch (error) {
      hostelLogger.logger.error('Failed to cleanup expired holds', { error: error.message });
      throw error;
    }
  }
}

export const hostelService = new HostelService();
