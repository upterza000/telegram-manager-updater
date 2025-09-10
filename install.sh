#!/bin/bash

echo "🚀 Installing Telegram Manager Updater..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "📦 Installing FFmpeg..."
    
    # Detect OS and install FFmpeg
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt update
        sudo apt install -y ffmpeg
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ffmpeg
        else
            echo "❌ Please install Homebrew or FFmpeg manually on macOS"
            exit 1
        fi
    else
        echo "❌ Please install FFmpeg manually for your OS"
        exit 1
    fi
fi

# Verify FFmpeg installation
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg installation failed"
    exit 1
fi

echo "✅ FFmpeg installed successfully"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create necessary directories
mkdir -p temp output config

# Copy configuration files
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file from template"
fi

if [ ! -f config/config.json ]; then
    cp config/config.example.json config/config.json
    echo "📝 Created config.json file from template"
fi

echo ""
echo "🎉 Installation completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials:"
echo "   - TELEGRAM_BOT_TOKEN"
echo "   - GOOGLE_DRIVE_API_KEY"
echo "   - GOOGLE_SERVICE_ACCOUNT_KEY path"
echo ""
echo "2. Place your Google Service Account JSON file in config/"
echo ""
echo "3. Start the application:"
echo "   npm start"
echo ""
echo "4. Import N8N workflow from workflows/telegram-video-manager.json"
echo ""
echo "📚 Read README.md for detailed setup instructions"