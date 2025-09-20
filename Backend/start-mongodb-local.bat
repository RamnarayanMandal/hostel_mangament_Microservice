@echo off
echo Starting MongoDB locally...
echo.

REM Check if MongoDB is already running
netstat -an | find "27017" >nul
if %errorlevel% == 0 (
    echo MongoDB is already running on port 27017
    echo You can connect using: mongodb://localhost:27017/hostel-management
    pause
    exit /b 0
)

REM Try to start MongoDB service
echo Attempting to start MongoDB service...
net start MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo MongoDB service started successfully
    echo You can connect using: mongodb://localhost:27017/hostel-management
) else (
    echo Failed to start MongoDB service
    echo.
    echo Please ensure MongoDB is installed and try one of these options:
    echo 1. Install MongoDB Community Server from: https://www.mongodb.com/try/download/community
    echo 2. Start Docker Desktop and run: docker-compose up -d mongodb
    echo 3. Use MongoDB Atlas (cloud database)
    echo.
    echo For local MongoDB installation:
    echo - Download from: https://www.mongodb.com/try/download/community
    echo - Install and start the MongoDB service
    echo - Default connection: mongodb://localhost:27017/hostel-management
)

echo.
pause
