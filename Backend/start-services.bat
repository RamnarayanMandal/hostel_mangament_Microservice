@echo off
echo Starting Hostel Management Backend Services...
echo.

echo Checking if MongoDB is running...
netstat -an | findstr :27017 >nul
if %errorlevel% neq 0 (
    echo ERROR: MongoDB is not running on port 27017
    echo Please start MongoDB first
    pause
    exit /b 1
)

echo Checking if Redis is running...
netstat -an | findstr :6379 >nul
if %errorlevel% neq 0 (
    echo WARNING: Redis is not running on port 6379
    echo Services will work but caching will be disabled
    echo.
)

echo Starting all services...
npm run dev

pause
