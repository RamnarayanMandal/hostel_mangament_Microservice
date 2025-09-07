import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import "express-async-errors";

import { DatabaseConnection } from "../../shared/config/database";
import { RedisConnection } from "../../shared/config/redis";
import {
  getMessageBroker,
  EVENT_TYPES,
} from "../../shared/config/message-broker";
import { errorHandler } from "../../shared/utils/errors";
import { gatewayLogger } from "../../shared/utils/logger";
import { authenticate } from "../../shared/middleware/auth";

import gatewayRoutes from "./routes/gatewayRoutes";
import { GatewayService } from "./services/GatewayService";
import { specs, swaggerUi } from "../../shared/config/swagger";

const app = express();
const PORT = process.env.GATEWAY_PORT || 3010;

// Initialize services
const gatewayService = new GatewayService();

// Connect to database
const dbConnection = DatabaseConnection.getInstance();
const redisConnection = RedisConnection.getInstance();
const messageBroker = getMessageBroker();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    gatewayLogger.logger.info("Request processed", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    });
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "gateway",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Test endpoint for debugging
app.post("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Gateway test endpoint working",
    method: req.method,
    path: req.path,
    body: req.body,
    timestamp: new Date().toISOString(),
  });
});

// API Documentation
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Hostel Management API Documentation",
  })
);

// API Gateway Routes
app.use("/api/gateway", gatewayRoutes);

// Dynamic routing middleware - this is the core gateway functionality
app.use("*", async (req, res, next) => {
  try {
    const originalUrl = req.originalUrl;
    const method = req.method;

    // Skip gateway management routes
    if (originalUrl.startsWith("/api/gateway") || originalUrl === "/health") {
      return next();
    }

    // Use the public routeRequest method
    const proxyRequest = {
      method: req.method,
      path: req.originalUrl.split('?')[0], // Get path without query string
      headers: req.headers as Record<string, string>,
      query: req.query as Record<string, any>,
      body: req.body,
      user: req.user,
      ip: req.ip || "unknown",
      userAgent: req.get("User-Agent") || "",
    };

    const response = await gatewayService.routeRequest(proxyRequest);

    // Send response
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    console.error("Gateway routing error:", error);
    res.status(500).json({
      success: false,
      error: "Internal gateway error",
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  gatewayLogger.logger.info("SIGTERM received, shutting down gracefully");

  try {
    await dbConnection.disconnect();

    const disableRedis = process.env.DISABLE_REDIS === "true";
    const disableRabbitMQ = process.env.DISABLE_RABBITMQ === "true";

    if (!disableRedis) {
      await redisConnection.disconnect();
    }
    if (!disableRabbitMQ) {
      await messageBroker.disconnect();
    }

    process.exit(0);
  } catch (error) {
    gatewayLogger.logger.error("Error during shutdown", {
      error: (error as Error).message,
    });
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  gatewayLogger.logger.info("SIGINT received, shutting down gracefully");

  try {
    await dbConnection.disconnect();

    const disableRedis = process.env.DISABLE_REDIS === "true";
    const disableRabbitMQ = process.env.DISABLE_RABBITMQ === "true";

    if (!disableRedis) {
      await redisConnection.disconnect();
    }
    if (!disableRabbitMQ) {
      await messageBroker.disconnect();
    }

    process.exit(0);
  } catch (error) {
    gatewayLogger.logger.error("Error during shutdown", {
      error: (error as Error).message,
    });
    process.exit(1);
  }
});

// Start server
const startServer = async () => {
  try {
    // Connect to services
    await dbConnection.connect("gateway-db");

    // Check if Redis and RabbitMQ are disabled
    const disableRedis = process.env.DISABLE_REDIS === "true";
    const disableRabbitMQ = process.env.DISABLE_RABBITMQ === "true";

    if (!disableRedis) {
      await redisConnection.connect();
    } else {
      gatewayLogger.logger.info("Redis disabled for development");
    }

    if (!disableRabbitMQ) {
      await messageBroker.connect();

      // Subscribe to events
      await messageBroker.subscribeToEvents(
        "gateway-service",
        [
          EVENT_TYPES.STUDENT_CREATED,
          EVENT_TYPES.STUDENT_UPDATED,
          EVENT_TYPES.HOSTEL_CREATED,
          EVENT_TYPES.HOSTEL_UPDATED,
          EVENT_TYPES.BED_ALLOCATED,
          EVENT_TYPES.BED_RELEASED,
          EVENT_TYPES.BED_ALLOCATED,
          EVENT_TYPES.BED_RELEASED,
          EVENT_TYPES.ALLOCATION_REQUEST_CREATED,
          EVENT_TYPES.ALLOCATION_REQUEST_APPROVED,
          EVENT_TYPES.ALLOCATION_REQUEST_REJECTED,
          EVENT_TYPES.ALLOCATION_REQUEST_WAITLISTED,
          EVENT_TYPES.ALLOCATION_REQUEST_ALLOCATED,
          EVENT_TYPES.ALLOCATION_REQUEST_CANCELLED,
          EVENT_TYPES.BOOKING_CREATED,
          EVENT_TYPES.BOOKING_CONFIRMED,
          EVENT_TYPES.BOOKING_CANCELLED,
          EVENT_TYPES.BOOKING_CHECKED_IN,
          EVENT_TYPES.BOOKING_CHECKED_OUT,
          EVENT_TYPES.PAYMENT_CREATED,
          EVENT_TYPES.PAYMENT_SUCCEEDED,
          EVENT_TYPES.PAYMENT_FAILED,
          EVENT_TYPES.PAYMENT_REFUNDED,
          EVENT_TYPES.NOTIFICATION_SEND_REQUESTED,
          EVENT_TYPES.NOTIFICATION_SENT,
        ],
        async (message: any) => {
          gatewayLogger.logger.info("Event received", {
            type: message.type,
            service: message.service,
            timestamp: message.timestamp,
          });

          // Handle events as needed for gateway operations
          // For example, update service health, clear cache, etc.
        }
      );
    } else {
      gatewayLogger.logger.info("RabbitMQ disabled for development");
    }

    app.listen(PORT, () => {
      gatewayLogger.logger.info(`Gateway service started on port ${PORT}`);
    });
  } catch (error) {
    gatewayLogger.logger.error("Failed to start gateway service", {
      error: (error as Error).message,
    });
    process.exit(1);
  }
};

startServer();
