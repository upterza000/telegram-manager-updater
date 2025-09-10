#!/bin/bash

# FFmpeg Setup Script for Telegram Video Manager
# This script installs FFmpeg on various operating systems

set -e

echo "🎬 Setting up FFmpeg for Telegram Video Manager..."

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v apt-get &> /dev/null; then
        echo "📦 Detected Ubuntu/Debian - Installing FFmpeg..."
        sudo apt-get update
        sudo apt-get install -y ffmpeg
    elif command -v yum &> /dev/null; then
        echo "📦 Detected CentOS/RHEL - Installing FFmpeg..."
        sudo yum install -y epel-release
        sudo yum install -y ffmpeg ffmpeg-devel
    elif command -v dnf &> /dev/null; then
        echo "📦 Detected Fedora - Installing FFmpeg..."
        sudo dnf install -y ffmpeg ffmpeg-devel
    elif command -v pacman &> /dev/null; then
        echo "📦 Detected Arch Linux - Installing FFmpeg..."
        sudo pacman -S ffmpeg
    else
        echo "❌ Unsupported Linux distribution"
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📦 Detected macOS - Installing FFmpeg..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
    else
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    echo "📦 Detected Windows - Please download FFmpeg from:"
    echo "   https://ffmpeg.org/download.html#build-windows"
    echo "   Then add ffmpeg.exe to your PATH"
    exit 1
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

# Verify installation
echo "🔍 Verifying FFmpeg installation..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg installed successfully!"
    ffmpeg -version | head -1
    
    # Test faststart capability
    echo "🧪 Testing faststart capability..."
    if ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=1 -movflags +faststart -t 1 /tmp/test_faststart.mp4 -y &> /dev/null; then
        echo "✅ Faststart capability confirmed!"
        rm -f /tmp/test_faststart.mp4
    else
        echo "⚠️  Warning: Faststart test failed. Check FFmpeg compilation."
    fi
else
    echo "❌ FFmpeg installation failed!"
    exit 1
fi

echo "🎉 FFmpeg setup complete! Ready for Telegram Video Manager."