#!/bin/bash

# Telegram Manager Updater - N8N Workflow Deployment Script
# This script helps deploy and configure the video processing workflow

set -e

echo "🚀 Telegram Manager Updater - N8N Workflow Setup"
echo "=================================================="

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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_step "Checking prerequisites..."

# Check Node.js
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    print_status "Visit: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
fi

# Check npm
if ! command_exists npm; then
    print_error "npm is not installed."
    exit 1
else
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
fi

# Check FFmpeg
if ! command_exists ffmpeg; then
    print_warning "FFmpeg is not installed. Installing..."
    
    if command_exists apt-get; then
        sudo apt-get update && sudo apt-get install -y ffmpeg
    elif command_exists brew; then
        brew install ffmpeg
    elif command_exists yum; then
        sudo yum install -y ffmpeg
    else
        print_error "Cannot auto-install FFmpeg. Please install it manually."
        print_status "Visit: https://ffmpeg.org/download.html"
        exit 1
    fi
else
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
    print_status "FFmpeg found: $FFMPEG_VERSION"
fi

# Check N8N installation
print_step "Checking N8N installation..."

if ! command_exists n8n; then
    print_warning "N8N is not installed globally. Installing..."
    npm install -g n8n
else
    N8N_VERSION=$(n8n --version)
    print_status "N8N found: $N8N_VERSION"
fi

# Create N8N directory structure
print_step "Setting up N8N directory structure..."

N8N_HOME="${HOME}/.n8n"
WORKFLOWS_DIR="${N8N_HOME}/workflows"
CREDENTIALS_DIR="${N8N_HOME}/credentials"

mkdir -p "$WORKFLOWS_DIR"
mkdir -p "$CREDENTIALS_DIR"

print_status "N8N directories created at: $N8N_HOME"

# Copy workflow files
print_step "Copying workflow files..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy basic workflow
if [ -f "$SCRIPT_DIR/telegram-video-workflow.json" ]; then
    cp "$SCRIPT_DIR/telegram-video-workflow.json" "$WORKFLOWS_DIR/"
    print_status "Basic workflow copied"
fi

# Copy advanced workflow  
if [ -f "$SCRIPT_DIR/advanced-telegram-video-workflow.json" ]; then
    cp "$SCRIPT_DIR/advanced-telegram-video-workflow.json" "$WORKFLOWS_DIR/"
    print_status "Advanced workflow copied"
fi

# Copy config template
if [ -f "$SCRIPT_DIR/config-template.json" ]; then
    cp "$SCRIPT_DIR/config-template.json" "$N8N_HOME/"
    print_status "Configuration template copied"
fi

# Create environment file template
print_step "Creating environment configuration..."

cat > "$N8N_HOME/.env.example" << 'EOF'
# N8N Configuration
N8N_PORT=5678
N8N_HOST=localhost
N8N_PROTOCOL=http
N8N_BASIC_AUTH_ACTIVE=false
N8N_BASIC_AUTH_USER=
N8N_BASIC_AUTH_PASSWORD=

# Database (optional - SQLite by default)
DB_TYPE=sqlite
DB_SQLITE_DATABASE=database.sqlite

# Webhook URL
WEBHOOK_URL=http://localhost:5678

# Google Drive API
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=

# Telegram Bot
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# File Processing
TEMP_DIRECTORY=/tmp/n8n-video-processing
MAX_FILE_SIZE=52428800

# FFmpeg Settings
FFMPEG_PRESET=fast
FFMPEG_CRF=23
THUMBNAIL_QUALITY=2
EOF

print_status "Environment template created at: $N8N_HOME/.env.example"

# Create startup script
print_step "Creating startup script..."

cat > "$N8N_HOME/start-n8n.sh" << 'EOF'
#!/bin/bash

# Load environment variables if .env exists
if [ -f ~/.n8n/.env ]; then
    export $(cat ~/.n8n/.env | xargs)
fi

# Start N8N
echo "🚀 Starting N8N..."
echo "📡 Webhook URL: ${WEBHOOK_URL:-http://localhost:5678}"
echo "🔧 Web UI: ${N8N_PROTOCOL:-http}://${N8N_HOST:-localhost}:${N8N_PORT:-5678}"

n8n start
EOF

chmod +x "$N8N_HOME/start-n8n.sh"
print_status "Startup script created at: $N8N_HOME/start-n8n.sh"

# Create helper scripts
print_step "Creating helper scripts..."

# Test webhook script
cat > "$N8N_HOME/test-webhook.sh" << 'EOF'
#!/bin/bash

# Test the video processing webhook
WEBHOOK_URL="${1:-http://localhost:5678/webhook/video-process-advanced}"
FOLDER_ID="${2:-YOUR_FOLDER_ID}"
CHAT_ID="${3:-YOUR_CHAT_ID}"

if [ "$FOLDER_ID" == "YOUR_FOLDER_ID" ] || [ "$CHAT_ID" == "YOUR_CHAT_ID" ]; then
    echo "Usage: $0 [webhook_url] [folder_id] [chat_id]"
    echo "Example: $0 http://localhost:5678/webhook/video-process-advanced 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs67 123456789"
    exit 1
fi

echo "🧪 Testing webhook..."
echo "📡 URL: $WEBHOOK_URL"
echo "📁 Folder ID: $FOLDER_ID" 
echo "💬 Chat ID: $CHAT_ID"

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"folderId\": \"$FOLDER_ID\",
    \"telegramChatId\": \"$CHAT_ID\",
    \"limit\": 1
  }" | jq .

echo "✅ Test completed"
EOF

chmod +x "$N8N_HOME/test-webhook.sh"
print_status "Test script created at: $N8N_HOME/test-webhook.sh"

# Create setup guide
cat > "$N8N_HOME/SETUP.md" << 'EOF'
# Setup Guide for Telegram Video Processing Workflow

## 1. Configure Credentials

### Google Drive API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Create Service Account credentials
5. Download JSON key file
6. In N8N: Settings → Credentials → Add Google Service Account

### Telegram Bot Setup  
1. Message [@BotFather](https://t.me/botfather)
2. Create new bot with `/newbot`
3. Save the bot token
4. Get your chat ID by messaging [@userinfobot](https://t.me/userinfobot)
5. In N8N: Settings → Credentials → Add Telegram

## 2. Import Workflows
1. Open N8N web interface: http://localhost:5678
2. Go to Workflows → Import from file
3. Import `telegram-video-workflow.json` (basic) or `advanced-telegram-video-workflow.json`

## 3. Test the Setup
```bash
# Test basic workflow
./test-webhook.sh http://localhost:5678/webhook/video-process YOUR_FOLDER_ID YOUR_CHAT_ID

# Test advanced workflow  
./test-webhook.sh http://localhost:5678/webhook/video-process-advanced YOUR_FOLDER_ID YOUR_CHAT_ID
```

## 4. Production Configuration
- Copy `.env.example` to `.env` and fill in your values
- Consider using a process manager like PM2
- Set up proper logging and monitoring
- Configure firewall rules for webhook endpoints
EOF

print_status "Setup guide created at: $N8N_HOME/SETUP.md"

# Final instructions
print_step "Installation completed! 🎉"
echo
print_status "Next steps:"
echo "1. 📝 Configure credentials: Copy $N8N_HOME/.env.example to $N8N_HOME/.env and fill in your values"
echo "2. 🚀 Start N8N: Run $N8N_HOME/start-n8n.sh"
echo "3. 🌐 Open web interface: http://localhost:5678"
echo "4. 📖 Read setup guide: $N8N_HOME/SETUP.md"
echo "5. 🧪 Test webhook: Use $N8N_HOME/test-webhook.sh"
echo
print_warning "Don't forget to:"
echo "  - Set up Google Drive API credentials"
echo "  - Create Telegram bot and get chat ID"  
echo "  - Share Google Drive folder with service account email"
echo
print_status "Happy video processing! 🎬"
EOF