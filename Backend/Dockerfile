# Simple Dockerfile for Hostel Management Microservices
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose all service ports
EXPOSE 3010 3001 3002 3003 3004 3005 3006 3007 3008 3009

# Default command - runs all services
CMD ["npm", "run", "dev:all"]
