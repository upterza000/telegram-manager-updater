# 🚀 Quick Setup Guide - Telegram Video Streaming Workflow

## 📋 Prerequisites Checklist

- [ ] N8N instance running (local or cloud)
- [ ] FFmpeg installed on the server
- [ ] Google Drive API access 
- [ ] Telegram Bot created
- [ ] Basic understanding of N8N workflows

## ⚡ 5-Minute Setup

### 1. Import Workflow
1. Open your N8N instance
2. Go to **Workflows** → **Import from File**
3. Select `telegram-video-workflow.json`
4. Click **Import**

### 2. Configure Credentials

#### Google Drive OAuth2
```bash
# Create credentials at: https://console.cloud.google.com
# Enable Google Drive API
# Set OAuth 2.0 redirect URI to your N8N callback URL
```

#### Telegram Bot
```bash
# Create bot via @BotFather on Telegram
# Save the bot token
# Get your chat ID (send message to bot, check logs)
```

### 3. System Requirements

#### Install FFmpeg
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# CentOS/RHEL  
sudo yum install ffmpeg

# macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### 4. Test Workflow

1. **Manual Trigger**: Click execute on the workflow
2. **Check Logs**: Monitor N8N execution logs
3. **Verify Output**: Check Telegram for optimized video
4. **Confirm Streaming**: Video should play inline immediately

## 🔧 Configuration Tips

### File Size Optimization
- **Telegram Limit**: 50MB max for bots
- **Compression**: Adjust quality if needed
- **Format**: MP4 recommended for best compatibility

### Streaming Requirements
```bash
# Essential FFmpeg flags for inline play:
-movflags +faststart  # Move moov atom to beginning
-c copy              # Copy streams without re-encoding
-avoid_negative_ts make_zero  # Fix timestamp issues
```

### Google Drive Setup
- Create dedicated folder for videos
- Set appropriate sharing permissions
- Use specific mime type filters: `mimeType contains 'video/'`

## ⚠️ Troubleshooting

### Common Issues

1. **Video won't play inline**
   - Check `-movflags +faststart` is applied
   - Verify sent as Video, not Document
   - Confirm file size under 50MB

2. **FFmpeg not found**
   ```bash
   which ffmpeg
   # Should return: /usr/bin/ffmpeg or similar
   ```

3. **Google Drive access denied**
   - Verify OAuth2 credentials
   - Check API quotas
   - Ensure proper scopes

4. **Telegram delivery fails**
   - Validate bot token
   - Check chat ID format
   - Monitor rate limits

### Debug Steps
```bash
# Test FFmpeg manually
ffmpeg -i input.mp4 -movflags +faststart -c copy output.mp4

# Check video metadata
ffprobe -show_format -show_streams input.mp4

# Verify moov atom position
ffprobe -show_packets input.mp4 | grep -i moov
```

## 📊 Performance Monitoring

### Key Metrics to Track
- Processing time per video
- Success/failure rates  
- Telegram delivery confirmations
- User engagement with videos

### Optimization Tips
- **Batch Processing**: Queue multiple videos
- **Resource Management**: Monitor temp disk space
- **Error Handling**: Implement retry logic
- **Cleanup**: Remove processed files regularly

## 🔐 Security Best Practices

1. **Credential Management**
   - Store in N8N credential vault
   - Use environment variables
   - Regular token rotation

2. **Access Control**
   - Limit Google Drive folder access
   - Restrict Telegram bot to specific chats
   - Monitor API usage

3. **File Handling**
   - Validate file types before processing
   - Scan for malware if needed
   - Clean temporary files

## 🎯 Next Steps

After basic setup:
- [ ] Test with sample videos
- [ ] Configure error notifications
- [ ] Set up monitoring dashboards
- [ ] Implement batch processing
- [ ] Add custom caption templates

## 💡 Pro Tips

1. **Thumbnail Quality**: Adjust `-q:v 2` for better thumbnails
2. **Processing Speed**: Use `-c copy` to avoid re-encoding
3. **File Organization**: Create dated folders in Google Drive
4. **User Experience**: Add progress indicators for long videos
5. **Monitoring**: Set up alerts for failed executions

---

**Need Help?** Check the main README.md for detailed documentation and troubleshooting guides.