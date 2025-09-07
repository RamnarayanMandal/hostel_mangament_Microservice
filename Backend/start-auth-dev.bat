@echo off
echo Starting Auth Service with RabbitMQ disabled...
set DISABLE_RABBITMQ=true
set DISABLE_REDIS=true
set NODE_ENV=development
npm run dev:auth

