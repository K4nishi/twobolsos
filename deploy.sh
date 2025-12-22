#!/bin/bash
# =====================================================
# TwoBolsos - Deploy Script
# Run this on your server to deploy the application
# =====================================================

set -e

echo "=========================================="
echo "       TwoBolsos - Deploy Script"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not available.${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from template...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}Created .env from template. Please edit it with your settings.${NC}"
    else
        echo "API_URL=http://localhost:8000" > .env
        echo -e "${GREEN}Created default .env file.${NC}"
    fi
fi

# Parse command line arguments
ACTION="${1:-up}"

case "$ACTION" in
    "up"|"start")
        echo -e "${GREEN}[1/3] Building Docker images...${NC}"
        docker compose build --no-cache

        echo -e "${GREEN}[2/3] Starting containers...${NC}"
        docker compose up -d

        echo -e "${GREEN}[3/3] Waiting for services to be ready...${NC}"
        sleep 5

        echo ""
        echo -e "${GREEN}=========================================="
        echo "       Deployment Complete!"
        echo "==========================================${NC}"
        echo ""
        echo "Frontend: http://localhost (or your server IP)"
        echo "Backend API: http://localhost:8000"
        echo "API Docs: http://localhost:8000/docs"
        echo ""
        echo "To view logs: docker compose logs -f"
        echo "To stop: ./deploy.sh stop"
        ;;

    "down"|"stop")
        echo -e "${YELLOW}Stopping containers...${NC}"
        docker compose down
        echo -e "${GREEN}Containers stopped.${NC}"
        ;;

    "restart")
        echo -e "${YELLOW}Restarting containers...${NC}"
        docker compose restart
        echo -e "${GREEN}Containers restarted.${NC}"
        ;;

    "logs")
        docker compose logs -f
        ;;

    "update")
        echo -e "${GREEN}Pulling latest changes and rebuilding...${NC}"
        git pull origin main || true
        docker compose build --no-cache
        docker compose up -d
        echo -e "${GREEN}Update complete!${NC}"
        ;;

    "status")
        docker compose ps
        ;;

    "clean")
        echo -e "${YELLOW}Cleaning up old images and volumes...${NC}"
        docker compose down -v
        docker system prune -f
        echo -e "${GREEN}Cleanup complete.${NC}"
        ;;

    *)
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  up, start   - Build and start containers (default)"
        echo "  down, stop  - Stop containers"
        echo "  restart     - Restart containers"
        echo "  logs        - View container logs"
        echo "  update      - Pull latest code and rebuild"
        echo "  status      - Show container status"
        echo "  clean       - Remove containers, volumes, and prune"
        ;;
esac
