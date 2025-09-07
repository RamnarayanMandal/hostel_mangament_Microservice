import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { RedisMemoryServer } from 'redis-memory-server';
import Redis from 'ioredis';

let mongoServer: MongoMemoryServer;
let redisServer: RedisMemoryServer;
let redisClient: Redis;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Setup Redis Memory Server
  redisServer = new RedisMemoryServer();
  const redisPort = await redisServer.getPort();
  const redisHost = await redisServer.getHost();
  
  redisClient = new Redis({
    host: redisHost,
    port: redisPort,
  });

  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongoUri;
  process.env.REDIS_HOST = redisHost;
  process.env.REDIS_PORT = redisPort.toString();
  process.env.RABBITMQ_HOST = 'localhost';
  process.env.RABBITMQ_PORT = '5672';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_EXPIRES_IN = '1h';
});

afterAll(async () => {
  // Cleanup
  await mongoose.disconnect();
  await mongoServer.stop();
  await redisClient.disconnect();
  await redisServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  // Clear Redis
  await redisClient.flushall();
});

// Global test utilities
global.testUtils = {
  createTestUser: async (userData: any = {}) => {
    // Implementation for creating test users
  },
  createTestStudent: async (studentData: any = {}) => {
    // Implementation for creating test students
  },
  createTestHostel: async (hostelData: any = {}) => {
    // Implementation for creating test hostels
  },
  generateAuthToken: (userId: string, role: string = 'STUDENT') => {
    // Implementation for generating test JWT tokens
  },
};
