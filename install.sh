#!/bin/bash

# Telegram Video Manager Installation Script
# Installs and configures N8N with video processing capabilities

set -e

echo "🚀 Installing Telegram Video Manager..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first:"
        echo "  https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first:"
        echo "  https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check available disk space (need at least 5GB)
    available_space=$(df . | awk 'NR==2 {print $4}')
    required_space=5242880 # 5GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log_warning "Low disk space detected. At least 5GB recommended for video processing."
    fi
    
    log_success "System requirements check passed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        log_success "Created .env file from template"
        
        # Generate random passwords
        N8N_PASSWORD=$(openssl rand -base64 12 2>/dev/null || date +%s | sha256sum | base64 | head -c 12)
        DB_PASSWORD=$(openssl rand -base64 16 2>/dev/null || date +%s | sha256sum | base64 | head -c 16)
        GRAFANA_PASSWORD=$(openssl rand -base64 12 2>/dev/null || date +%s | sha256sum | base64 | head -c 12)
        
        # Update .env file with generated passwords
        sed -i "s/changeme/$N8N_PASSWORD/g" .env
        sed -i "s/n8n_password/$DB_PASSWORD/g" .env
        sed -i "s/admin/$GRAFANA_PASSWORD/g" .env
        
        log_success "Generated secure passwords for services"
        
        echo ""
        log_warning "IMPORTANT: Please update the following in your .env file:"
        echo "  - TELEGRAM_BOT_TOKEN: Your Telegram bot token from @BotFather"
        echo "  - TELEGRAM_CHAT_ID: Your Telegram chat/channel ID"
        echo "  - GOOGLE_DRIVE_FOLDER_ID: Your Google Drive folder ID to monitor"
        echo ""
        echo "Generated passwords:"
        echo "  - N8N Admin: admin / $N8N_PASSWORD"
        echo "  - Database: n8n / $DB_PASSWORD"
        echo "  - Grafana: admin / $GRAFANA_PASSWORD"
        echo ""
        
        read -p "Press Enter to continue after updating .env file..." -r
    else
        log_info ".env file already exists, skipping creation"
    fi
}

# Install FFmpeg
install_ffmpeg() {
    log_info "Setting up FFmpeg..."
    
    if command -v ffmpeg &> /dev/null; then
        log_success "FFmpeg already installed: $(ffmpeg -version | head -1)"
    else
        log_info "Installing FFmpeg..."
        ./scripts/setup-ffmpeg.sh
    fi
}

# Setup Docker networks and volumes
setup_docker() {
    log_info "Setting up Docker environment..."
    
    # Create network if it doesn't exist
    if ! docker network ls | grep -q telegram-video-net; then
        docker network create telegram-video-net
        log_success "Created Docker network: telegram-video-net"
    fi
    
    # Pull required images
    log_info "Pulling Docker images..."
    docker-compose pull
    
    log_success "Docker environment ready"
}

# Start services
start_services() {
    log_info "Starting services..."
    
    # Start core services
    docker-compose up -d n8n postgres
    
    log_info "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Core services started successfully"
        
        # Get N8N URL
        N8N_URL="http://localhost:5678"
        log_info "N8N is available at: $N8N_URL"
        
        # Show credentials
        N8N_USER=$(grep N8N_BASIC_AUTH_USER .env | cut -d'=' -f2 | tr -d '"')
        N8N_PASS=$(grep N8N_BASIC_AUTH_PASSWORD .env | cut -d'=' -f2 | tr -d '"')
        
        echo ""
        log_success "Login credentials:"
        echo "  Username: ${N8N_USER:-admin}"
        echo "  Password: ${N8N_PASS:-changeme}"
        echo ""
        
        # Optional services
        read -p "Start optional services (Redis cache, Grafana monitoring)? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose --profile cache --profile monitoring up -d
            log_success "Optional services started"
            log_info "Grafana is available at: http://localhost:3000"
        fi
    else
        log_error "Failed to start services"
        docker-compose logs
        exit 1
    fi
}

# Import workflows
import_workflows() {
    log_info "Workflows are ready to import into N8N"
    echo ""
    echo "Available workflows:"
    echo "  1. workflows/n8n-video-telegram-workflow.json - Basic workflow"
    echo "  2. workflows/advanced-telegram-video-workflow.json - Advanced with error handling"
    echo ""
    echo "To import:"
    echo "  1. Open N8N at http://localhost:5678"
    echo "  2. Click 'Templates' or 'Import from file'"
    echo "  3. Select one of the workflow JSON files"
    echo "  4. Configure credentials as described in README.md"
    echo ""
}

# Test installation
test_installation() {
    log_info "Running installation tests..."
    
    # Test FFmpeg
    if ./scripts/test-video-processing.sh &> /dev/null; then
        log_success "FFmpeg video processing test passed"
    else
        log_warning "FFmpeg test had issues, but installation can continue"
    fi
    
    # Test Docker services
    if docker-compose ps | grep -q "Up.*n8n" && docker-compose ps | grep -q "Up.*postgres"; then
        log_success "Docker services are running correctly"
    else
        log_error "Docker services test failed"
        return 1
    fi
    
    log_success "Installation tests completed"
}

# Main installation process
main() {
    echo "=============================================="
    echo "🎬 Telegram Video Manager Installation"
    echo "=============================================="
    echo ""
    
    # Run installation steps
    check_requirements
    setup_environment
    install_ffmpeg
    setup_docker
    start_services
    import_workflows
    test_installation
    
    echo ""
    echo "=============================================="
    log_success "🎉 Installation completed successfully!"
    echo "=============================================="
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with API credentials"
    echo "2. Open N8N at http://localhost:5678"
    echo "3. Import and configure workflows"
    echo "4. Start processing videos!"
    echo ""
    echo "For help and documentation, see README.md"
    echo ""
}

# Handle script interruption
trap 'log_error "Installation interrupted"; exit 1' INT TERM

# Run main installation if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi