import { Request, Response } from 'express';
import { hostelService } from '../services/HostelService';
import { validateRequest, createHostelSchema, updateHostelSchema, createRoomSchema, updateRoomSchema, createBedSchema, updateBedSchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';
import { asyncHandler, successResponse, errorResponse } from '../../../shared/utils/errors';
import { hostelLogger } from '../../../shared/utils/logger';

export class HostelController {
  // Hostel Management
  public createHostel = asyncHandler(async (req: Request, res: Response) => {
    const hostel = await hostelService.createHostel(req.validatedData);
    hostelLogger.logger.info('Hostel created', { hostelId: hostel._id, createdBy: req.user?.userId });
    successResponse(res, hostel, 'Hostel created successfully', 201);
  });

  public getHostelById = asyncHandler(async (req: Request, res: Response) => {
    const hostel = await hostelService.getHostelById(req.params.id);
    successResponse(res, hostel, 'Hostel retrieved successfully');
  });

  public updateHostel = asyncHandler(async (req: Request, res: Response) => {
    const hostel = await hostelService.updateHostel(req.params.id, req.validatedData);
    hostelLogger.logger.info('Hostel updated', { hostelId: hostel._id, updatedBy: req.user?.userId });
    successResponse(res, hostel, 'Hostel updated successfully');
  });

  public getHostels = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, ...filters } = req.validatedData;
    const result = await hostelService.getHostels(page, limit, filters);
    successResponse(res, result, 'Hostels retrieved successfully');
  });

  public searchHostels = asyncHandler(async (req: Request, res: Response) => {
    const { searchTerm } = req.query;
    if (!searchTerm || typeof searchTerm !== 'string') {
      return errorResponse(res, 'Search term is required', 400);
    }
    const hostels = await hostelService.searchHostels(searchTerm);
    successResponse(res, hostels, 'Hostels search completed');
  });

  public getHostelsByCampus = asyncHandler(async (req: Request, res: Response) => {
    const { campus } = req.params;
    const hostels = await hostelService.getHostelsByCampus(campus);
    successResponse(res, hostels, 'Hostels retrieved by campus');
  });

  public getHostelsByAmenity = asyncHandler(async (req: Request, res: Response) => {
    const { amenity } = req.params;
    const hostels = await hostelService.getHostelsByAmenity(amenity);
    successResponse(res, hostels, 'Hostels retrieved by amenity');
  });

  // Room Management
  public createRoom = asyncHandler(async (req: Request, res: Response) => {
    const room = await hostelService.createRoom(req.validatedData);
    hostelLogger.logger.info('Room created', { roomId: room._id, hostelId: room.hostelId, createdBy: req.user?.userId });
    successResponse(res, room, 'Room created successfully', 201);
  });

  public getRoomById = asyncHandler(async (req: Request, res: Response) => {
    const room = await hostelService.getRoomById(req.params.id);
    successResponse(res, room, 'Room retrieved successfully');
  });

  public updateRoom = asyncHandler(async (req: Request, res: Response) => {
    const room = await hostelService.updateRoom(req.params.id, req.validatedData);
    hostelLogger.logger.info('Room updated', { roomId: room._id, updatedBy: req.user?.userId });
    successResponse(res, room, 'Room updated successfully');
  });

  public getRoomsByHostel = asyncHandler(async (req: Request, res: Response) => {
    const { hostelId } = req.params;
    const { type, status, floor } = req.query;
    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (floor) filters.floor = parseInt(floor as string);
    
    const rooms = await hostelService.getRoomsByHostel(hostelId, filters);
    successResponse(res, rooms, 'Rooms retrieved successfully');
  });

  public getAvailableRooms = asyncHandler(async (req: Request, res: Response) => {
    const { hostelId } = req.params;
    const { type } = req.query;
    const rooms = await hostelService.getAvailableRooms(hostelId, type as string);
    successResponse(res, rooms, 'Available rooms retrieved successfully');
  });

  // Bed Management
  public createBed = asyncHandler(async (req: Request, res: Response) => {
    const bed = await hostelService.createBed(req.validatedData);
    hostelLogger.logger.info('Bed created', { bedId: bed._id, roomId: bed.roomId, createdBy: req.user?.userId });
    successResponse(res, bed, 'Bed created successfully', 201);
  });

  public getBedById = asyncHandler(async (req: Request, res: Response) => {
    const bed = await hostelService.getBedById(req.params.id);
    successResponse(res, bed, 'Bed retrieved successfully');
  });

  public updateBed = asyncHandler(async (req: Request, res: Response) => {
    const bed = await hostelService.updateBed(req.params.id, req.validatedData);
    hostelLogger.logger.info('Bed updated', { bedId: bed._id, updatedBy: req.user?.userId });
    successResponse(res, bed, 'Bed updated successfully');
  });

  public getBedsByRoom = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const beds = await hostelService.getBedsByRoom(roomId);
    successResponse(res, beds, 'Beds retrieved successfully');
  });

  public getAvailableBeds = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const beds = await hostelService.getAvailableBeds(roomId);
    successResponse(res, beds, 'Available beds retrieved successfully');
  });

  public holdBed = asyncHandler(async (req: Request, res: Response) => {
    const { bedId } = req.params;
    const { bookingId, ttlSeconds } = req.body;
    const bed = await hostelService.holdBed(bedId, bookingId, ttlSeconds);
    hostelLogger.logger.info('Bed held', { bedId: bed._id, bookingId, heldBy: req.user?.userId });
    successResponse(res, bed, 'Bed held successfully');
  });

  public allocateBed = asyncHandler(async (req: Request, res: Response) => {
    const { bedId } = req.params;
    const { bookingId } = req.body;
    const bed = await hostelService.allocateBed(bedId, bookingId);
    hostelLogger.logger.info('Bed allocated', { bedId: bed._id, bookingId, allocatedBy: req.user?.userId });
    successResponse(res, bed, 'Bed allocated successfully');
  });

  public releaseBed = asyncHandler(async (req: Request, res: Response) => {
    const { bedId } = req.params;
    const bed = await hostelService.releaseBed(bedId);
    hostelLogger.logger.info('Bed released', { bedId: bed._id, releasedBy: req.user?.userId });
    successResponse(res, bed, 'Bed released successfully');
  });

  public getBedStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const statistics = await hostelService.getBedStatistics(roomId);
    successResponse(res, statistics, 'Bed statistics retrieved successfully');
  });

  public getHostelBedStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { hostelId } = req.params;
    const statistics = await hostelService.getHostelBedStatistics(hostelId);
    successResponse(res, statistics, 'Hostel bed statistics retrieved successfully');
  });

  public cleanupExpiredHolds = asyncHandler(async (req: Request, res: Response) => {
    await hostelService.cleanupExpiredHolds();
    hostelLogger.logger.info('Expired holds cleaned up', { cleanedBy: req.user?.userId });
    successResponse(res, null, 'Expired holds cleaned up successfully');
  });

  public health = asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, { status: 'healthy', service: 'hostel-registry' }, 'Hostel Registry Service is healthy');
  });
}

export const hostelController = new HostelController();
