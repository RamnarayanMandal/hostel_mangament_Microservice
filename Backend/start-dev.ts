import { spawn } from 'child_process';
import { createLogger } from './src/shared/utils/logger';

const logger = createLogger('dev-orchestrator').logger;

// Service configurations with environment variables to disable Redis/RabbitMQ
const services = [
  { 
    name: 'Gateway', 
    port: 3010, 
    script: 'dev:gateway',
    env: { 
      ...process.env, 
      PORT: '3010',
      DISABLE_REDIS: 'true',
      DISABLE_RABBITMQ: 'true'
    }
  },
  { 
    name: 'Auth', 
    port: 3001, 
    script: 'dev:auth',
    env: { 
      ...process.env, 
      PORT: '3001',
      DISABLE_REDIS: 'true',
      DISABLE_RABBITMQ: 'true'
    }
  },
  { 
    name: 'Student', 
    port: 3002, 
    script: 'dev:student',
    env: { 
      ...process.env, 
      PORT: '3002',
      DISABLE_REDIS: 'true',
      DISABLE_RABBITMQ: 'true'
    }
  },
  { 
    name: 'Hostel', 
    port: 3003, 
    script: 'dev:hostel',
    env: { 
      ...process.env, 
      PORT: '3003',
      DISABLE_REDIS: 'true',
      DISABLE_RABBITMQ: 'true'
    }
  },
  { 
    name: 'Allocation', 
    port: 3004, 
    script: 'dev:allocation',
    env: { 
      ...process.env, 
      PORT: '3004',
      DISABLE_REDIS: 'true',
      DISABLE_RABBITMQ: 'true'
    }
  },
  { 
    name: 'Pricing', 
    port: 3005, 
    script: 'dev:pricing',
    env: { 
      ...process.env, 
      PORT: '3005',
      DISABLE_REDIS: 'true',
      DISABLE_RABBITMQ: 'true'
    }
  },
  { 
    name: 'Booking', 
    port: 3006, 
    script: 'dev:booking',
    env: { 
      ...process.env, 
      PORT: '3006',
      DISABLE_REDIS: 'true',
      DISABLE_RABBITMQ: 'true'
    }
  },
  { 
    name: 'Payment', 
    port: 3007, 
    script: 'dev:payment',
    env: { 
      ...process.env, 
      PORT: '3007',
      DISABLE_REDIS: 'true',
      DISABLE_RABBITMQ: 'true'
    }
  },
  { 
    name: 'Notification', 
    port: 3008, 
    script: 'dev:notification',
    env: { 
      ...process.env, 
      PORT: '3008',
      DISABLE_REDIS: 'true',
      DISABLE_RABBITMQ: 'true'
    }
  },
  { 
    name: 'Admin', 
    port: 3009, 
    script: 'dev:admin',
    env: { 
      ...process.env, 
      PORT: '3009',
      DISABLE_REDIS: 'true',
      DISABLE_RABBITMQ: 'true'
    }
  },
];

// Store child processes
const childProcesses: { [key: string]: any } = {};

// Start a single service
const startService = (serviceName: string, script: string, env: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    logger.info(`🚀 Starting ${serviceName} service...`);
    
    const child = spawn('npm', ['run', script], {
      stdio: 'pipe',
      shell: true,
      env: env
    });

    childProcesses[serviceName] = child;

    child.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        logger.info(`[${serviceName}] ${output}`);
      }
    });

    child.stderr?.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('Warning') && !output.includes('Redis') && !output.includes('RabbitMQ')) {
        logger.error(`[${serviceName}] ${output}`);
      }
    });

    child.on('error', (error) => {
      logger.error(`❌ Failed to start ${serviceName}:`, error);
      reject(error);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        logger.error(`❌ ${serviceName} service exited with code ${code}`);
        reject(new Error(`${serviceName} service exited with code ${code}`));
      } else {
        logger.info(`✅ ${serviceName} service stopped gracefully`);
      }
    });

    // Wait a bit for the service to start
    setTimeout(() => {
      logger.info(`✅ ${serviceName} service started successfully`);
      resolve();
    }, 3010);
  });
};

// Start all services
const startAllServices = async () => {
  try {
    logger.info('🎯 Starting Hostel Management Microservices System (Development Mode)...');
    logger.info('📋 Services to start:');
    services.forEach(service => {
      logger.info(`   ${service.name}: http://localhost:${service.port}`);
    });
    logger.info('⚠️  Running in development mode - Redis and RabbitMQ disabled');

    // Start services sequentially to avoid port conflicts
    for (const service of services) {
      try {
        await startService(service.name, service.script, service.env);
        // Wait a bit between services
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`❌ Failed to start ${service.name}:`, error);
        // Continue with other services
      }
    }

    logger.info('🎉 All services started!');
    logger.info('📊 Service Status:');
    services.forEach(service => {
      logger.info(`   ✅ ${service.name}: http://localhost:${service.port}`);
    });

    logger.info('🔗 Main Gateway: http://localhost:3010');
    logger.info('📚 API Documentation: http://localhost:3010/api/docs');
    logger.info('🏥 Health Check: http://localhost:3010/health');
    logger.info('💡 Development Mode: Redis and RabbitMQ are disabled');

  } catch (error) {
    logger.error('❌ Failed to start services:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop all child processes
    for (const [serviceName, child] of Object.entries(childProcesses)) {
      if (child && !child.killed) {
        logger.info(`🛑 Stopping ${serviceName} service...`);
        child.kill('SIGTERM');
        
        // Wait for graceful shutdown
        await new Promise(resolve => {
          child.on('exit', () => {
            logger.info(`✅ ${serviceName} service stopped`);
            resolve(true);
          });
          
          // Force kill after 5 seconds
          setTimeout(() => {
            if (!child.killed) {
              child.kill('SIGKILL');
              logger.warn(`⚠️ Force killed ${serviceName} service`);
            }
            resolve(true);
          }, 5000);
        });
      }
    }
    
    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the system
startAllServices();
