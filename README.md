# Telegram Video Manager - N8N Workflow

## 📋 Overview
This N8N workflow automates the process of finding videos from Google Drive, optimizing them for Telegram streaming, and sending them with inline playback support.

## 🎯 Features

### ✅ Core Functionality
- **Google Drive Integration**: Automatically searches for video files
- **Binary Download**: Downloads videos in binary format for processing  
- **FFmpeg Optimization**: Processes videos with `-movflags +faststart` for inline streaming
- **Thumbnail Generation**: Creates automatic thumbnails from video frames
- **Telegram Streaming**: Sends videos with `supports_streaming=true` for inline playback
- **Size Validation**: Checks video size limits (50MB for Telegram)

### 🔧 Technical Implementation
- **moov atom positioning**: Uses FFmpeg `+faststart` flag to move metadata to file beginning
- **Streaming optimization**: Ensures videos play inline in Telegram without downloading
- **Caption & Buttons**: Rich message formatting with interactive buttons
- **Error handling**: Size checks and processing validation

## 📁 Files

### `telegram-video-workflow.json`
Main N8N workflow file containing all nodes and connections for:
- Google Drive video search
- Binary download and processing
- FFmpeg optimization with faststart
- Thumbnail generation  
- Telegram bot integration

## 🚀 Setup Instructions

### Prerequisites
1. **N8N Instance**: Running N8N server (local or cloud)
2. **Google Drive API**: OAuth2 credentials configured
3. **Telegram Bot**: Bot token and chat permissions
4. **FFmpeg**: Installed on N8N server for video processing

### Configuration Steps

1. **Import Workflow**
   ```bash
   # Import the workflow file into N8N
   # Navigate to N8N > Workflows > Import from File
   # Select: telegram-video-workflow.json
   ```

2. **Configure Google Drive**
   - Set up Google Drive OAuth2 credentials
   - Grant access to Drive API
   - Test connection with a sample folder

3. **Configure Telegram Bot**
   - Create bot via @BotFather
   - Add bot token to N8N credentials
   - Set target chat ID for video delivery

4. **System Requirements**
   ```bash
   # Ensure FFmpeg is installed
   ffmpeg -version
   
   # Required for video processing
   apt-get install ffmpeg  # Ubuntu/Debian
   brew install ffmpeg     # macOS
   ```

## 🔄 Workflow Process

### Step-by-Step Execution

1. **Trigger**: Manual trigger starts the workflow
2. **Search**: Google Drive node finds videos matching criteria
3. **Download**: HTTP Request downloads video binary data
4. **Size Check**: Validates video size (≤50MB for Telegram)
5. **Optimize**: FFmpeg processes with `-movflags +faststart`
6. **Thumbnail**: Generates thumbnail from video frame
7. **Upload**: Telegram sends optimized video with streaming support

### Node Details

#### Google Drive Search
```json
{
  "operation": "list",
  "q": "mimeType contains 'video/' and trashed=false",
  "fields": ["id", "name", "mimeType", "size", "webContentLink"]
}
```

#### FFmpeg Optimization
```bash
ffmpeg -i input_video -movflags +faststart -c copy -avoid_negative_ts make_zero output_video.mp4
```

#### Telegram Video Send
```json
{
  "operation": "sendVideo", 
  "supports_streaming": true,
  "parse_mode": "HTML",
  "reply_markup": {
    "inline_keyboard": [...]
  }
}
```

## 🎛️ Configuration Options

### Video Processing
- **Quality**: Maintain original quality with `-c copy`
- **Streaming**: Enable `+faststart` for instant playback
- **Thumbnails**: Extract frame at 1 second mark
- **Size Limits**: 50MB max for Telegram compatibility

### Telegram Settings
- **Message Format**: HTML with emoji and metadata
- **Buttons**: Interactive controls for user actions
- **Captions**: Auto-generated with file info
- **Streaming**: Enabled for inline playback

## 🐛 Troubleshooting

### Common Issues

1. **Video Won't Play Inline**
   - Ensure `-movflags +faststart` is applied
   - Check video is sent as Video type, not Document
   - Verify file size is under Telegram limits

2. **FFmpeg Errors**  
   ```bash
   # Check FFmpeg installation
   which ffmpeg
   
   # Test basic conversion
   ffmpeg -i test.mp4 -movflags +faststart output.mp4
   ```

3. **Google Drive Access**
   - Verify OAuth2 credentials are valid
   - Check API quotas and limits
   - Ensure proper file permissions

4. **Telegram Delivery**
   - Validate bot token and permissions
   - Check chat ID is correct
   - Monitor file size limits (50MB)

## 📊 Performance Tips

### Optimization Strategies
- **Batch Processing**: Process multiple videos in sequence
- **File Cleanup**: Remove temporary files after processing
- **Error Handling**: Add retry logic for network issues
- **Monitoring**: Log processing times and success rates

### Resource Management
```bash
# Monitor disk space for temp files
df -h /tmp/

# Clean up processed files
rm -f /tmp/optimized_video.mp4 /tmp/thumbnail.jpg
```

## 🔐 Security Considerations

### Best Practices
- Store credentials securely in N8N vault
- Limit Google Drive folder access scope
- Use environment variables for sensitive data
- Regular credential rotation

### Access Control
- Restrict bot to specific chats only
- Monitor API usage and quotas
- Log all video processing activities
- Implement user authentication if needed

## 📈 Monitoring & Analytics

### Key Metrics
- Video processing success rate
- Average processing time per video
- Telegram delivery confirmation
- User interaction with buttons

### Logging
```javascript
// Add to workflow for monitoring
console.log(`Processing: ${video_name}, Size: ${video_size}MB`);
console.log(`Optimization complete, sending to Telegram...`);
```

## 🛠️ Customization

### Extending the Workflow
- Add video format conversion options
- Implement custom thumbnail generation
- Add user notification systems  
- Create video metadata database
- Integrate with other cloud storage providers

### Advanced Features
- Automatic video quality detection
- Custom caption templates
- Scheduled batch processing
- Integration with content management systems

---

## 📞 Support

For issues or questions:
1. Check N8N documentation for node-specific help
2. Verify FFmpeg and API configurations
3. Test individual nodes in isolation
4. Monitor N8N execution logs for errors

**Note**: This workflow requires proper credentials and API access for Google Drive and Telegram Bot services.