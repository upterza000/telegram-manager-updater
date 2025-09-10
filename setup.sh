#!/bin/bash

# Telegram Manager Updater Setup Script

echo "🚀 Setting up Telegram Manager Updater..."

# Create directories
echo "📁 Creating directories..."
mkdir -p config temp logs

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Test setup
echo "🧪 Running setup test..."
npm run test:setup

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration:"
echo "   - TELEGRAM_BOT_TOKEN (get from @BotFather)"
echo "   - TELEGRAM_CHAT_ID (your chat/channel ID)"
echo "   - GOOGLE_DRIVE_FOLDER_ID (Google Drive folder to monitor)"
echo ""
echo "2. Add Google Drive credentials:"
echo "   - Place service account JSON in config/google-credentials.json"
echo ""
echo "3. Start the application:"
echo "   npm start              # Start normally"
echo "   npm run dev            # Start with auto-reload"
echo "   npm run deploy         # Start with Docker"
echo ""
echo "4. Import N8N workflow:"
echo "   - File: src/workflows/video-processing-workflow.json"
echo ""
echo "📚 Read README.md for detailed instructions"