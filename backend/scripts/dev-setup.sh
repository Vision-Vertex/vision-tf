#!/bin/bash

# ===========================================
# Vision-TF Development Setup Script
# Cross-platform setup for new developers
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    print_status "Detected OS: $OS"
}

# Check if Docker is installed and running
check_docker() {
    print_step "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop first."
        print_status "Download from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check if .env file exists
check_env_file() {
    print_step "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env file from template"
            print_warning "Please edit .env file with your configuration values"
            print_status "You can edit it now or continue and edit it later"
            read -p "Do you want to edit .env now? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if command -v nano &> /dev/null; then
                    nano .env
                elif command -v vim &> /dev/null; then
                    vim .env
                else
                    print_status "Please edit .env file manually with your preferred editor"
                fi
            fi
        else
            print_error ".env.example not found. Please create .env file manually."
            exit 1
        fi
    else
        print_success ".env file found"
    fi
}

# Start containers
start_containers() {
    print_step "Starting Docker containers..."
    
    docker-compose up -d
    
    print_success "Containers started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_step "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for database..."
    until docker exec vision-tf-backend npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; do
        print_warning "Database not ready, retrying in 5 seconds..."
        sleep 5
    done
    print_success "Database is ready"
    
    # Wait for API
    print_status "Waiting for API..."
    until curl -f http://localhost:3000/v1/health > /dev/null 2>&1; do
        print_warning "API not ready, retrying in 5 seconds..."
        sleep 5
    done
    print_success "API is ready"
}

# Run database setup
run_database_setup() {
    print_step "Running database setup..."
    
    docker exec vision-tf-backend ./scripts/setup-db.sh
    
    print_success "Database setup completed"
}

# Show final status
show_final_status() {
    print_header "🎉 Setup Complete!"
    
    echo -e "${GREEN}✅ Vision-TF Backend is now running!${NC}"
    echo
    echo -e "${CYAN}📋 Service URLs:${NC}"
    echo -e "   Backend API: ${BLUE}http://localhost:3000${NC}"
    echo -e "   API Documentation: ${BLUE}http://localhost:3000/api${NC}"
    echo -e "   Health Check: ${BLUE}http://localhost:3000/v1/health${NC}"
    echo -e "   RabbitMQ Management: ${BLUE}http://localhost:15672${NC}"
    echo
    echo -e "${CYAN}🔑 Test Users (if seeded):${NC}"
    echo -e "   Admin: ${BLUE}admin@vision-tf.com${NC}"
    echo -e "   Developer: ${BLUE}developer@vision-tf.com${NC}"
    echo -e "   Client: ${BLUE}client@vision-tf.com${NC}"
    echo
    echo -e "${CYAN}🛠️  Useful Commands:${NC}"
    echo -e "   View logs: ${BLUE}./scripts/dev-logs.sh${NC}"
    echo -e "   Stop services: ${BLUE}./scripts/dev-stop.sh${NC}"
    echo -e "   Reset everything: ${BLUE}./scripts/dev-reset.sh${NC}"
    echo
    echo -e "${YELLOW}💡 Tip: Check the README.md for more information${NC}"
}

# Main execution
main() {
    print_header "Vision-TF Development Setup"
    
    detect_os
    check_docker
    check_env_file
    start_containers
    wait_for_services
    run_database_setup
    show_final_status
}

# Run main function
main "$@"
