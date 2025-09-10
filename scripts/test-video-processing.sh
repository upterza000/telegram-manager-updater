#!/bin/bash

# Test Video Processing Script
# Tests FFmpeg processing for Telegram streaming compatibility

set -e

echo "🧪 Testing Video Processing for Telegram Compatibility..."

# Create test directory
TEST_DIR="/tmp/telegram-video-test"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Generate test video
echo "📹 Generating test video..."
ffmpeg -f lavfi -i testsrc=duration=10:size=640x480:rate=30 \
       -f lavfi -i sine=frequency=1000:duration=10 \
       -c:v libx264 -c:a aac -t 10 \
       original.mp4 -y

echo "✅ Test video created: $(ls -lh original.mp4 | awk '{print $5}')"

# Test faststart processing
echo "⚡ Processing with faststart..."
ffmpeg -i original.mp4 \
       -movflags +faststart \
       -c copy \
       -avoid_negative_ts make_zero \
       optimized.mp4 -y

echo "✅ Optimized video created: $(ls -lh optimized.mp4 | awk '{print $5}')"

# Generate thumbnail
echo "🖼️  Generating thumbnail..."
ffmpeg -i optimized.mp4 \
       -ss 00:00:01.000 \
       -vframes 1 \
       -q:v 2 \
       thumbnail.jpg -y

echo "✅ Thumbnail created: $(ls -lh thumbnail.jpg | awk '{print $5}')"

# Check moov atom position
echo "🔍 Checking moov atom position..."
if command -v ffprobe &> /dev/null; then
    echo "Original video info:"
    ffprobe -v quiet -show_format -show_streams original.mp4 | grep -E "(duration|bit_rate)" || true
    
    echo "Optimized video info:"
    ffprobe -v quiet -show_format -show_streams optimized.mp4 | grep -E "(duration|bit_rate)" || true
    
    # Check if moov atom is at the beginning (rough check)
    MOOV_POS=$(hexdump -C optimized.mp4 | grep -n "moov" | head -1 | cut -d: -f1 || echo "999999")
    if [ "$MOOV_POS" -lt 100 ]; then
        echo "✅ moov atom appears to be at the beginning of the file"
    else
        echo "⚠️  moov atom position check inconclusive"
    fi
else
    echo "⚠️  ffprobe not available for detailed analysis"
fi

# Simulate Telegram upload size check
FILESIZE=$(stat -c%s optimized.mp4)
MAX_SIZE=52428800  # 50MB

echo "📏 File size check:"
echo "   Optimized video: $(echo "scale=2; $FILESIZE/1048576" | bc -l)MB"
echo "   Telegram limit: 50MB"

if [ "$FILESIZE" -lt "$MAX_SIZE" ]; then
    echo "✅ File size within Telegram Bot API limits"
else
    echo "⚠️  File size exceeds Telegram Bot API limit (50MB)"
fi

# Test different quality settings
echo "🎯 Testing quality settings..."

# High quality
ffmpeg -i original.mp4 -movflags +faststart -crf 18 -preset slow high_quality.mp4 -y
HQ_SIZE=$(stat -c%s high_quality.mp4)

# Medium quality  
ffmpeg -i original.mp4 -movflags +faststart -crf 23 -preset medium medium_quality.mp4 -y
MQ_SIZE=$(stat -c%s medium_quality.mp4)

# Low quality
ffmpeg -i original.mp4 -movflags +faststart -crf 28 -preset fast low_quality.mp4 -y
LQ_SIZE=$(stat -c%s low_quality.mp4)

echo "Quality comparison:"
echo "   High (CRF 18):   $(echo "scale=2; $HQ_SIZE/1048576" | bc -l)MB"
echo "   Medium (CRF 23): $(echo "scale=2; $MQ_SIZE/1048576" | bc -l)MB" 
echo "   Low (CRF 28):    $(echo "scale=2; $LQ_SIZE/1048576" | bc -l)MB"

# Cleanup option
echo ""
read -p "🧹 Delete test files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd ..
    rm -rf "$TEST_DIR"
    echo "✅ Test files cleaned up"
else
    echo "📁 Test files preserved in: $TEST_DIR"
fi

echo "🎉 Video processing test complete!"
echo ""
echo "💡 Tips for production use:"
echo "   - Use CRF 23 for good balance of quality/size"
echo "   - Always include +faststart for Telegram streaming"
echo "   - Monitor file sizes to stay under 50MB limit"
echo "   - Test with your actual video content for best results"