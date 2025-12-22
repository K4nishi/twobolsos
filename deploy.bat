@echo off
REM =====================================================
REM TwoBolsos - Deploy Script for Windows
REM Run this to deploy the application with Docker
REM =====================================================

echo ==========================================
echo        TwoBolsos - Deploy Script
echo ==========================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running or not installed.
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Get the action from command line or default to "up"
set ACTION=%1
if "%ACTION%"=="" set ACTION=up

if "%ACTION%"=="up" goto :start
if "%ACTION%"=="start" goto :start
if "%ACTION%"=="down" goto :stop
if "%ACTION%"=="stop" goto :stop
if "%ACTION%"=="restart" goto :restart
if "%ACTION%"=="logs" goto :logs
if "%ACTION%"=="status" goto :status
if "%ACTION%"=="update" goto :update
if "%ACTION%"=="clean" goto :clean
goto :help

:start
echo [1/3] Building Docker images...
docker compose build --no-cache
if errorlevel 1 goto :error

echo [2/3] Starting containers...
docker compose up -d
if errorlevel 1 goto :error

echo [3/3] Waiting for services to be ready...
timeout /t 5 /nobreak >nul

echo.
echo ==========================================
echo        Deployment Complete!
echo ==========================================
echo.
echo Frontend: http://localhost
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo To view logs: deploy.bat logs
echo To stop: deploy.bat stop
goto :end

:stop
echo Stopping containers...
docker compose down
echo Containers stopped.
goto :end

:restart
echo Restarting containers...
docker compose restart
echo Containers restarted.
goto :end

:logs
docker compose logs -f
goto :end

:status
docker compose ps
goto :end

:update
echo Pulling latest changes and rebuilding...
git pull origin main
docker compose build --no-cache
docker compose up -d
echo Update complete!
goto :end

:clean
echo Cleaning up old images and volumes...
docker compose down -v
docker system prune -f
echo Cleanup complete.
goto :end

:help
echo Usage: deploy.bat [command]
echo.
echo Commands:
echo   up, start   - Build and start containers (default)
echo   down, stop  - Stop containers
echo   restart     - Restart containers
echo   logs        - View container logs
echo   update      - Pull latest code and rebuild
echo   status      - Show container status
echo   clean       - Remove containers, volumes, and prune
goto :end

:error
echo [ERROR] Something went wrong. Check the output above.
pause
exit /b 1

:end
pause
