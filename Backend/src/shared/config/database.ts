import mongoose from 'mongoose';
import { config } from './env';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connections: Map<string, mongoose.Connection> = new Map();

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(databaseName: string, retries: number = 3): Promise<mongoose.Connection> {
    // Check if we already have a connection to this database
    if (this.connections.has(databaseName)) {
      const existingConnection = this.connections.get(databaseName)!;
      if (existingConnection.readyState === 1) {
        return existingConnection;
      }
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Extract base URI without database name
        const baseUri = config.database.uri.replace(/\/[^\/]*$/, '');
        const uri = `${baseUri}/${databaseName}`;

        console.log(`Connecting to MongoDB URI (attempt ${attempt}/${retries}):`, uri);
        
        // Create a new connection for this specific database
        const connection = mongoose.createConnection(uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 60000, // Increased to 60 seconds
          socketTimeoutMS: 90000, // Increased to 90 seconds
          bufferCommands: false,
          connectTimeoutMS: 60000, // Connection timeout increased to 60 seconds
          heartbeatFrequencyMS: 10000, // Heartbeat frequency
          retryWrites: true,
          retryReads: true,
          maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        });

        connection.on('connected', () => {
          console.log(`✅ MongoDB connected to ${databaseName}`);
        });

        connection.on('error', (err) => {
          console.error(`❌ MongoDB connection error for ${databaseName}:`, err);
        });

        connection.on('disconnected', () => {
          console.log(`🔌 MongoDB disconnected from ${databaseName}`);
        });

        // Wait for connection to be established
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Connection timeout after 60 seconds for ${databaseName}`));
          }, 60000);

          connection.once('connected', () => {
            clearTimeout(timeout);
            resolve(connection);
          });

          connection.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });

        // Store the connection for this database
        this.connections.set(databaseName, connection);

        return connection;
      } catch (error) {
        console.error(`❌ Failed to connect to MongoDB ${databaseName} (attempt ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          console.error(`❌ All connection attempts failed for ${databaseName}`);
          throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // Wait before retrying
        const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error(`Failed to connect to MongoDB ${databaseName} after ${retries} attempts`);
  }

  public async disconnect(): Promise<void> {
    for (const [databaseName, connection] of this.connections) {
      try {
        await connection.close();
        console.log(`🔌 Disconnected from ${databaseName}`);
      } catch (error) {
        console.error(`❌ Error disconnecting from ${databaseName}:`, error);
      }
    }
    this.connections.clear();
  }

  public getConnection(databaseName?: string): mongoose.Connection | null {
    if (databaseName) {
      return this.connections.get(databaseName) || null;
    }
    // Return the first available connection for backward compatibility
    return this.connections.values().next().value || null;
  }
}

export const getDatabaseConnection = (databaseName: string) => {
  return DatabaseConnection.getInstance().connect(databaseName);
};

// Helper function to check if MongoDB is available
export const checkMongoDBAvailability = async (): Promise<boolean> => {
  try {
    const baseUri = config.database.uri.replace(/\/[^\/]*$/, '');
    const testUri = `${baseUri}/test`;
    
    const testConnection = mongoose.createConnection(testUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MongoDB connection timeout'));
      }, 5000);

      testConnection.once('connected', () => {
        clearTimeout(timeout);
        testConnection.close();
        resolve(true);
      });

      testConnection.once('error', (err) => {
        clearTimeout(timeout);
        testConnection.close();
        reject(err);
      });
    });

    return true;
  } catch (error) {
    console.error('MongoDB availability check failed:', error);
    return false;
  }
};
