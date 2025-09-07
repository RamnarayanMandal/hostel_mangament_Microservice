# 🏠 Hostel Management Microservices System

A comprehensive, production-ready microservices architecture for hostel management built with Node.js, TypeScript, MongoDB, Redis, and RabbitMQ.

## 🏗️ Architecture Overview

This system implements a true microservices architecture with:

- **10 Microservices**: Each with its own database, API, and business logic
- **Event-Driven Communication**: Asynchronous messaging via RabbitMQ
- **API Gateway**: Centralized routing, authentication, and rate limiting
- **Polyrepo Structure**: Each service is independently deployable
- **Type Safety**: Full TypeScript implementation with Zod validation

### Services

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| API Gateway | 3010 | gateway-db | Central routing and orchestration |
| Auth & Identity | 3001 | auth-db | User management and authentication |
| Student | 3002 | student-db | Student profiles and KYC |
| Hostel Registry | 3003 | hostel-db | Hostel and room management |
| Allocation | 3004 | allocation-db | Bed allocation and rules |
| Pricing & Fees | 3005 | pricing-db | Fee policies and calculations |
| Booking | 3006 | booking-db | Room booking and availability |
| Payment | 3007 | payment-db | Payment processing and refunds |
| Notification | 3008 | notification-db | Email, SMS, and push notifications |
| Admin & Reporting | 3009 | admin-db | Admin dashboard and reports |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MongoDB 6.0+
- Redis 7+
- RabbitMQ 3.9+

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd hostel-management-backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Start Individual Services**
   ```bash
   # Start all services
   npm run dev:all
   
   # Start specific service
   npm run dev:gateway
   npm run dev:auth
   npm run dev:student
   # ... etc
   ```

### API Documentation

Once running, access the API at:
- **Gateway**: http://localhost:3010
- **RabbitMQ Management**: http://localhost:15672 (admin/password123)
- **MongoDB**: mongodb://localhost:27017

## 📚 API Endpoints

### Authentication
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Students
```http
GET    /api/students
POST   /api/students
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id
```

### Hostels
```http
GET    /api/hostels
POST   /api/hostels
GET    /api/hostels/:id
PUT    /api/hostels/:id
DELETE /api/hostels/:id
```

### Bookings
```http
GET    /api/bookings
POST   /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id
DELETE /api/bookings/:id
```

### Payments
```http
GET    /api/payments
POST   /api/payments
GET    /api/payments/:id
POST   /api/payments/:id/refund
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Specific service tests
npm run test:auth
npm run test:student
npm run test:hostel

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure
```
src/
├── services/
│   ├── auth/
│   │   ├── __tests__/
│   │   │   ├── auth.test.ts
│   │   │   ├── user.test.ts
│   │   │   └── integration.test.ts
│   │   └── ...
│   └── ...
└── test/
    ├── setup.ts
    ├── utils.ts
    └── fixtures/
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Individual Service
```bash
# Build specific service
docker build --target production -t hostel-gateway .

# Run with environment
docker run -p 3010:3010 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/gateway-db \
  -e REDIS_HOST=host.docker.internal \
  hostel-gateway
```

## 🔧 Configuration

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=3010

# Database
MONGODB_URI=mongodb://localhost:27017/hostel-db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASS=password123

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email/SMS
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

## 📊 Monitoring & Health Checks

### Health Endpoints
```http
GET /health                    # Service health
GET /api/gateway/health        # Gateway health
GET /api/gateway/stats         # Gateway statistics
GET /api/gateway/services      # Service health status
```

### Logging
- **Structured Logging**: Winston with JSON format
- **Log Levels**: error, warn, info, debug
- **Correlation IDs**: Request tracing across services

### Metrics
- Request/response times
- Error rates
- Service availability
- Database connection status

## 🔒 Security Features

- **JWT Authentication**: Stateless token-based auth
- **Role-Based Access Control**: Student, Admin, Staff roles
- **Rate Limiting**: Per-user and per-endpoint limits
- **Input Validation**: Zod schema validation
- **CORS Protection**: Configurable cross-origin policies
- **Helmet Security**: HTTP security headers

## 📈 Performance Optimizations

- **Redis Caching**: Response caching and session storage
- **Database Indexing**: Optimized MongoDB queries
- **Connection Pooling**: Efficient database connections
- **Compression**: Gzip response compression
- **Load Balancing**: Ready for horizontal scaling

## 🚀 Production Deployment

### Kubernetes
```yaml
# Example deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hostel-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hostel-gateway
  template:
    metadata:
      labels:
        app: hostel-gateway
    spec:
      containers:
      - name: gateway
        image: hostel-gateway:latest
        ports:
        - containerPort: 3010
```

### CI/CD Pipeline
```yaml
# GitHub Actions example
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build and Deploy
      run: |
        docker build -t hostel-gateway .
        docker push hostel-gateway:latest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- 70% test coverage minimum

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)

## 🗺️ Roadmap

- [ ] GraphQL API
- [ ] Real-time notifications (WebSocket)
- [ ] Mobile app API
- [ ] Advanced analytics
- [ ] Multi-tenant support
- [ ] Internationalization
- [ ] Advanced reporting
- [ ] Machine learning recommendations

---

**Built with ❤️ using Node.js, TypeScript, and Microservices Architecture**
