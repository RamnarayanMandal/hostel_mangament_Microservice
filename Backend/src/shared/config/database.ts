import mongoose from 'mongoose';
import { config } from './env';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: mongoose.Connection | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(databaseName: string): Promise<mongoose.Connection> {
    if (this.connection && this.connection.readyState === 1) {
      return this.connection;
    }

    try {
      // Extract base URI without database name
      const baseUri = config.database.uri.replace(/\/[^\/]*$/, '');
      const uri = `${baseUri}/${databaseName}`;

      console.log('Connecting to MongoDB URI:', uri);
      
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });

      this.connection = mongoose.connection;

      this.connection.on('connected', () => {
        console.log(`✅ MongoDB connected to ${databaseName}`);
      });

      this.connection.on('error', (err) => {
        console.error(`❌ MongoDB connection error for ${databaseName}:`, err);
      });

      this.connection.on('disconnected', () => {
        console.log(`🔌 MongoDB disconnected from ${databaseName}`);
      });

      return this.connection;
    } catch (error) {
      console.error(`❌ Failed to connect to MongoDB ${databaseName}:`, error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
    }
  }

  public getConnection(): mongoose.Connection | null {
    return this.connection;
  }
}

export const getDatabaseConnection = (databaseName: string) => {
  return DatabaseConnection.getInstance().connect(databaseName);
};
