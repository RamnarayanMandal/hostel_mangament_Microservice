import amqp, { Connection, Channel } from "amqplib";
import { createLogger } from "../utils/logger";
import { config } from "./env";

const messageBrokerLogger = createLogger("message-broker");

export const EVENT_TYPES = {
  // User events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",

  // Student events
  STUDENT_CREATED: "student.created",
  STUDENT_UPDATED: "student.updated",
  STUDENT_DELETED: "student.deleted",
  STUDENT_KYC_VERIFIED: "student.kyc.verified",

  // Hostel events
  HOSTEL_CREATED: "hostel.created",
  HOSTEL_UPDATED: "hostel.updated",
  HOSTEL_DELETED: "hostel.deleted",
  ROOM_CREATED: "room.created",
  ROOM_UPDATED: "room.updated",
  ROOM_DELETED: "room.deleted",
  BED_ALLOCATED: "bed.allocated",
  BED_RELEASED: "bed.released",

  // Allocation events
  ALLOCATION_REQUEST_CREATED: "allocation.request.created",
  ALLOCATION_REQUEST_APPROVED: "allocation.request.approved",
  ALLOCATION_REQUEST_REJECTED: "allocation.request.rejected",
  ALLOCATION_REQUEST_WAITLISTED: "allocation.request.waitlisted",
  ALLOCATION_REQUEST_ALLOCATED: "allocation.request.allocated",
  ALLOCATION_REQUEST_CANCELLED: "allocation.request.cancelled",

  // Booking events
  BOOKING_CREATED: "booking.created",
  BOOKING_CONFIRMED: "booking.confirmed",
  BOOKING_CANCELLED: "booking.cancelled",
  BOOKING_CHECKED_IN: "booking.checked.in",
  BOOKING_CHECKED_OUT: "booking.checked.out",

  // Payment events
  PAYMENT_CREATED: "payment.created",
  PAYMENT_SUCCEEDED: "payment.succeeded",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",
  REFUND_PROCESSED: "refund.processed",

  // Notification events
  NOTIFICATION_SEND_REQUESTED: "notification.send.requested",
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_DELIVERED: "notification.delivered",
  NOTIFICATION_FAILED: "notification.failed",

  // Admin events
  ADMIN_CREATED: "admin.created",
  ADMIN_UPDATED: "admin.updated",
  ADMIN_DELETED: "admin.deleted",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export interface EventMessage {
  id: string;
  type: EventType;
  service: string;
  data: any;
  timestamp: Date;
  correlationId?: string;
}

class MessageBroker {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected = false;

  public async connect(): Promise<void> {
    try {
      // Check if RabbitMQ is disabled
      if (process.env.RABBITMQ_ENABLED === "false" || process.env.DISABLE_RABBITMQ === "true") {
        messageBrokerLogger.logger.info(
          "RabbitMQ is disabled, skipping connection"
        );
        return;
      }

      if (this.isConnected) {
        return;
      }

      const vhost = encodeURIComponent(config.rabbitmq.vhost || "/");
      const url = `amqp://${config.rabbitmq.username}:${config.rabbitmq.password}@${config.rabbitmq.host}:${config.rabbitmq.port}/${vhost}`;

      // console.log("Connecting to RabbitMQ at", url);

      this.connection = (await amqp.connect(url)) as any;
      this.channel = (await (this.connection as any).createChannel()) as any;

      // Assert exchange
      await this.channel!.assertExchange("hostel_events", "topic", {
        durable: true,
      });

      this.isConnected = true;
      messageBrokerLogger.logger.info("Connected to RabbitMQ");
    } catch (error) {
      messageBrokerLogger.logger.error("Failed to connect to RabbitMQ:", error);
      this.isConnected = false;
      // Don't throw error, allow services to continue without message broker
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }
      this.isConnected = false;
      messageBrokerLogger.logger.info("Disconnected from RabbitMQ");
    } catch (error) {
      messageBrokerLogger.logger.error(
        "Error disconnecting from RabbitMQ:",
        error
      );
    }
  }

  public async publishEvent(event: EventMessage): Promise<void> {
    try {
      if (!this.isConnected || !this.channel) {
        messageBrokerLogger.logger.warn(
          "Message broker not connected, skipping event publish"
        );
        return;
      }

      const message = JSON.stringify(event);
      await this.channel.publish(
        "hostel_events",
        event.type,
        Buffer.from(message),
        {
          persistent: true,
          correlationId: event.correlationId,
        }
      );

      messageBrokerLogger.logger.info("Event published", {
        eventType: event.type,
        service: event.service,
      });
    } catch (error) {
      messageBrokerLogger.logger.error("Failed to publish event:", error);
      // Don't throw error, allow services to continue
    }
  }

  public async subscribeToEvents(
    serviceName: string,
    eventTypes: EventType[],
    handler: (message: EventMessage) => Promise<void>
  ): Promise<void> {
    try {
      if (!this.isConnected || !this.channel) {
        messageBrokerLogger.logger.warn(
          "Message broker not connected, skipping event subscription"
        );
        return;
      }

      // Create queue for this service
      const queueName = `${serviceName}_queue`;
      await this.channel.assertQueue(queueName, { durable: true });

      // Bind queue to exchange for each event type
      for (const eventType of eventTypes) {
        await this.channel.bindQueue(queueName, "hostel_events", eventType);
      }

      // Consume messages
      await this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const event: EventMessage = JSON.parse(msg.content.toString());
          await handler(event);
          this.channel!.ack(msg);
        } catch (error) {
          messageBrokerLogger.logger.error("Error processing message:", error);
          this.channel!.nack(msg, false, true);
        }
      });

      messageBrokerLogger.logger.info("Subscribed to events", {
        service: serviceName,
        eventTypes,
      });
    } catch (error) {
      messageBrokerLogger.logger.error("Failed to subscribe to events:", error);
      // Don't throw error, allow services to continue
    }
  }

  public isReady(): boolean {
    return this.isConnected;
  }
}

const messageBroker = new MessageBroker();

export const getMessageBroker = () => messageBroker;
