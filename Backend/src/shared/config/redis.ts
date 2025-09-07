import Redis from 'ioredis';
import { config } from './env';

export class RedisConnection {
  private static instance: RedisConnection;
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private publisher: Redis | null = null;

  private constructor() {}

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<Redis | null> {
    if (this.client && this.client.status === 'ready') {
      return this.client;
    }

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      } as any);

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
      });

      this.client.on('close', () => {
        console.log('🔌 Redis connection closed');
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.warn('⚠️ Redis connection failed, continuing without Redis:', (error as Error).message);
      this.client = null;
      return null;
    }
  }

  public async getSubscriber(): Promise<Redis> {
    if (this.subscriber && this.subscriber.status === 'ready') {
      return this.subscriber;
    }

    this.subscriber = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
    });

    await this.subscriber.connect();
    return this.subscriber;
  }

  public async getPublisher(): Promise<Redis> {
    if (this.publisher && this.publisher.status === 'ready') {
      return this.publisher;
    }

    this.publisher = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
    });

    await this.publisher.connect();
    return this.publisher;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
    if (this.subscriber) {
      await this.subscriber.disconnect();
      this.subscriber = null;
    }
    if (this.publisher) {
      await this.publisher.disconnect();
      this.publisher = null;
    }
  }

  public getClient(): Redis | null {
    return this.client;
  }
}

export const getRedisConnection = () => {
  return RedisConnection.getInstance().connect();
};

export const getRedisSubscriber = () => {
  return RedisConnection.getInstance().getSubscriber();
};

export const getRedisPublisher = () => {
  return RedisConnection.getInstance().getPublisher();
};
