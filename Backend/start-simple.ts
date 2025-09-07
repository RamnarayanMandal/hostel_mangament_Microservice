import { spawn } from 'child_process';
import { createLogger } from './src/shared/utils/logger';

const logger = createLogger('startup');

// Set environment variables to disable external dependencies
process.env.REDIS_ENABLED = 'false';
process.env.RABBITMQ_ENABLED = 'false';
process.env.DISABLE_REDIS = 'true';
process.env.DISABLE_RABBITMQ = 'true';

const services = [
  { name: 'Gateway', script: 'dev:gateway', port: 3010 },
  { name: 'Auth', script: 'dev:auth', port: 3001 },
  { name: 'Student', script: 'dev:student', port: 3002 },
  { name: 'Hostel', script: 'dev:hostel', port: 3003 },
  { name: 'Allocation', script: 'dev:allocation', port: 3004 },
  { name: 'Pricing', script: 'dev:pricing', port: 3005 },
  { name: 'Booking', script: 'dev:booking', port: 3006 },
  { name: 'Payment', script: 'dev:payment', port: 3007 },
  { name: 'Notification', script: 'dev:notification', port: 3008 },
  { name: 'Admin', script: 'dev:admin', port: 3009 }
];

const processes: any[] = [];

async function startService(service: any) {
  return new Promise((resolve, reject) => {
    logger.logger.info(`🚀 Starting ${service.name} service...`);
    
    const child = spawn('npm', ['run', service.script], {
      stdio: 'pipe',
      env: { ...process.env }
    });

    child.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('running on port') || output.includes('started on port')) {
        logger.logger.info(`✅ ${service.name} service started successfully`);
        resolve(child);
      }
    });

    child.stderr?.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Error:') && !error.includes('Warning:')) {
        logger.logger.error(`❌ ${service.name} service error:`, error);
      }
    });

    child.on('error', (error) => {
      logger.logger.error(`❌ Failed to start ${service.name} service:`, error);
      reject(error);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        logger.logger.error(`❌ ${service.name} service exited with code ${code}`);
      }
    });

    processes.push(child);
  });
}

async function startAllServices() {
  logger.logger.info('🎯 Starting Hostel Management Microservices System...');
  logger.logger.info('📋 Services to start:');
  services.forEach(service => {
    logger.logger.info(`   ${service.name}: http://localhost:${service.port}`);
  });

  try {
    // Start services sequentially to avoid port conflicts
    for (const service of services) {
      await startService(service);
      // Small delay between services
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.logger.info('🎉 All services started!');
    logger.logger.info('📊 Service Status:');
    services.forEach(service => {
      logger.logger.info(`   ✅ ${service.name}: http://localhost:${service.port}`);
    });
    logger.logger.info('🔗 Main Gateway: http://localhost:3010');
    logger.logger.info('📚 API Documentation: http://localhost:3010/api/docs');
    logger.logger.info('🏥 Health Check: http://localhost:3010/health');

  } catch (error) {
    logger.logger.error('❌ Failed to start services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.logger.info('🛑 Shutting down all services...');
  
  for (const child of processes) {
    child.kill('SIGINT');
  }
  
  setTimeout(() => {
    logger.logger.info('🔄 Force killing remaining processes...');
    for (const child of processes) {
      child.kill('SIGKILL');
    }
    process.exit(0);
  }, 5000);
});

process.on('SIGTERM', async () => {
  logger.logger.info('🛑 Received SIGTERM, shutting down...');
  for (const child of processes) {
    child.kill('SIGTERM');
  }
  process.exit(0);
});

startAllServices();
