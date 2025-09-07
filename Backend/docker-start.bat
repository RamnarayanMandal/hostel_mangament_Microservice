@echo off
echo 🚀 Starting Hostel Management System with Docker...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.dev.yml down

REM Build and start services
echo 🔨 Building and starting services...
docker-compose -f docker-compose.dev.yml up --build -d

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service status
echo 📊 Checking service status...
docker-compose -f docker-compose.dev.yml ps

REM Show logs
echo 📋 Recent logs:
docker-compose -f docker-compose.dev.yml logs --tail=20

echo.
echo 🎉 Hostel Management System is starting!
echo.
echo 📋 Service URLs:
echo    🔗 Gateway: http://localhost:3000
echo    🔐 Auth: http://localhost:3001
echo    👨‍🎓 Student: http://localhost:3002
echo    🏠 Hostel: http://localhost:3003
echo    📋 Allocation: http://localhost:3004
echo    💰 Pricing: http://localhost:3005
echo    📅 Booking: http://localhost:3006
echo    💳 Payment: http://localhost:3007
echo    📧 Notification: http://localhost:3008
echo    👨‍💼 Admin: http://localhost:3009
echo.
echo 🗄️  Database:
echo    📊 MongoDB: localhost:27017
echo    🔴 Redis: localhost:6379
echo    🐰 RabbitMQ: localhost:5672
echo    🐰 RabbitMQ Management: http://localhost:15672
echo.
echo 📝 Useful commands:
echo    View logs: docker-compose -f docker-compose.dev.yml logs -f
echo    Stop services: docker-compose -f docker-compose.dev.yml down
echo    Restart services: docker-compose -f docker-compose.dev.yml restart
echo.
echo 🏥 Health check: http://localhost:3000/health
echo.
pause




