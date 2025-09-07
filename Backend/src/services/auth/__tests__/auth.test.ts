import request from 'supertest';
import express from 'express';
import { AuthService } from '../services/AuthService';
import { authController } from '../controllers/AuthController';
import { DatabaseConnection } from '../../../shared/config/database';
import { RedisConnection } from '../../../shared/config/redis';

// Mock the message broker
jest.mock('../../../shared/config/message-broker', () => ({
  MessageBroker: {
    getInstance: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      publishEvent: jest.fn(),
      subscribeToEvents: jest.fn(),
    })),
  },
  EVENT_TYPES: {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
  },
}));

describe('Auth Service', () => {
  let app: express.Application;
  let authService: AuthService;
  let dbConnection: DatabaseConnection;
  let redisConnection: RedisConnection;

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Setup database connections
    dbConnection = DatabaseConnection.getInstance();
    redisConnection = RedisConnection.getInstance();
    
    // Initialize auth service
    authService = new AuthService();
    
    // Setup routes
    app.post('/api/auth/register', authController.register);
    app.post('/api/auth/login', authController.login);
    app.post('/api/auth/refresh', authController.refreshToken);
    app.post('/api/auth/logout', authController.logout);
  });

  afterAll(async () => {
    await dbConnection.disconnect();
    await redisConnection.disconnect();
  });

  beforeEach(async () => {
    // Clear database before each test
    const collections = dbConnection.getConnection()?.collections;
    if (collections) {
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'STUDENT'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.fullName).toBe(userData.fullName);
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'Test User',
        role: 'STUDENT'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'STUDENT'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'STUDENT'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should return 404 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // This test would require a valid refresh token
      // Implementation depends on your refresh token logic
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ token: 'valid-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged out');
    });
  });
});





