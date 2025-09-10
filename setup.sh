#!/bin/bash

# Telegram Video Manager - N8N Workflow Setup Script
# This script helps you set up the complete video processing workflow

set -e

echo "🎬 Telegram Video Manager Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "📋 Checking Prerequisites..."
    
    # Check if Docker is installed
    if command -v docker &> /dev/null; then
        print_status "Docker is installed ✅"
    else
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if docker-compose is installed
    if command -v docker-compose &> /dev/null; then
        print_status "Docker Compose is installed ✅"
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if curl is installed
    if command -v curl &> /dev/null; then
        print_status "curl is installed ✅"
    else
        print_error "curl is not installed. Please install curl first."
        exit 1
    fi
}

# Setup environment file
setup_environment() {
    print_header "🔧 Setting up Environment Configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.template" ]; then
            cp .env.template .env
            print_status "Created .env file from template"
        else
            print_error ".env.template not found. Please ensure all files are present."
            exit 1
        fi
    else
        print_warning ".env file already exists. Skipping creation."
    fi
    
    print_status "Please edit .env file with your credentials:"
    print_status "  - TELEGRAM_BOT_TOKEN (get from @BotFather)"
    print_status "  - TELEGRAM_CHAT_ID (get from @userinfobot)" 
    print_status "  - N8N_BASIC_AUTH_PASSWORD (secure password)"
}

# Setup N8N with Docker
setup_n8n() {
    print_header "🚀 Setting up N8N with Docker..."
    
    # Create necessary directories
    mkdir -p ./n8n-data
    mkdir -p ./temp-processing
    
    # Pull latest N8N image
    print_status "Pulling latest N8N Docker image..."
    docker-compose pull
    
    # Start N8N
    print_status "Starting N8N container..."
    docker-compose up -d
    
    print_status "N8N is starting up. This may take a few minutes..."
    sleep 10
    
    # Check if N8N is running
    if docker-compose ps | grep -q "Up"; then
        print_status "N8N is running successfully! 🎉"
        print_status "Access N8N at: http://localhost:5678"
    else
        print_error "Failed to start N8N. Check docker-compose logs."
        exit 1
    fi
}

# Test FFmpeg in container
test_ffmpeg() {
    print_header "🧪 Testing FFmpeg Installation..."
    
    # Test FFmpeg in the N8N container
    if docker-compose exec n8n ffmpeg -version > /dev/null 2>&1; then
        print_status "FFmpeg is working in N8N container ✅"
    else
        print_warning "FFmpeg test failed. This might cause video processing issues."
    fi
}

# Import workflow
import_workflow() {
    print_header "📥 Workflow Import Instructions..."
    
    print_status "To import the workflow:"
    echo "  1. Open N8N at http://localhost:5678"
    echo "  2. Login with credentials from .env file"
    echo "  3. Go to Workflows → Import from File"
    echo "  4. Upload the 'telegram-video-workflow.json' file"
    echo "  5. Configure your credentials in the workflow nodes"
    echo
    print_status "Required credentials to setup in N8N:"
    echo "  - Google Drive OAuth2 API"
    echo "  - Update Telegram config in 'Set Telegram Config' node"
}

# Setup credentials helper
setup_credentials() {
    print_header "🔐 Credential Setup Guide..."
    
    echo "Google Drive Setup:"
    echo "  1. Go to https://console.cloud.google.com/"
    echo "  2. Create a new project or select existing"
    echo "  3. Enable Google Drive API"
    echo "  4. Create OAuth2 credentials"
    echo "  5. Add credentials in N8N: Google Drive OAuth2 API"
    echo
    echo "Telegram Bot Setup:"
    echo "  1. Message @BotFather on Telegram"
    echo "  2. Create new bot with /newbot command"
    echo "  3. Copy bot token to .env file"
    echo "  4. Get your chat ID from @userinfobot"
    echo "  5. Update 'Set Telegram Config' node in workflow"
}

# Show usage information
show_usage() {
    print_header "📖 Usage Information..."
    
    echo "Available commands:"
    echo "  ./setup.sh install    - Full installation"
    echo "  ./setup.sh start      - Start N8N"
    echo "  ./setup.sh stop       - Stop N8N"
    echo "  ./setup.sh logs       - View N8N logs"
    echo "  ./setup.sh restart    - Restart N8N"
    echo "  ./setup.sh status     - Check N8N status"
}

# Main installation function
install() {
    print_header "🎬 Starting Telegram Video Manager Installation..."
    echo
    
    check_prerequisites
    setup_environment
    setup_n8n
    test_ffmpeg
    import_workflow
    setup_credentials
    
    echo
    print_status "✅ Installation completed successfully!"
    print_status "Next steps:"
    echo "  1. Edit .env file with your credentials"
    echo "  2. Open N8N at http://localhost:5678"
    echo "  3. Import the workflow file"
    echo "  4. Configure credentials"
    echo "  5. Test the workflow!"
}

# Handle command line arguments
case "${1:-install}" in
    "install")
        install
        ;;
    "start")
        print_status "Starting N8N..."
        docker-compose up -d
        ;;
    "stop")
        print_status "Stopping N8N..."
        docker-compose down
        ;;
    "restart")
        print_status "Restarting N8N..."
        docker-compose restart
        ;;
    "logs")
        print_status "Showing N8N logs..."
        docker-compose logs -f
        ;;
    "status")
        print_status "N8N Status:"
        docker-compose ps
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac