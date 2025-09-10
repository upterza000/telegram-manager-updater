# Telegram Video Manager - N8N Workflow

A comprehensive N8N workflow for processing videos from Google Drive and sending them to Telegram with inline streaming support.

## 🎯 Features

- **📁 Google Drive Integration**: Search and download videos from Google Drive folders
- **⚡ FFmpeg Processing**: Optimize videos for Telegram inline streaming with faststart
- **🖼️ Automatic Thumbnails**: Generate video thumbnails automatically
- **📱 Telegram Streaming**: Send videos with full inline playback support
- **🎬 Smart Captions**: Auto-generated captions with file info and streaming indicators
- **🔘 Interactive Buttons**: Optional inline buttons for enhanced user experience

## 🔧 Technical Requirements

### Key Features for Telegram Inline Streaming
- Videos are sent as **Video** type (not Document)
- Files processed with `ffmpeg -movflags +faststart` to move moov atom to file header
- H.264/AAC encoding for maximum compatibility
- Automatic thumbnail generation for better user experience

## 📋 Prerequisites

### N8N Setup
1. N8N instance (cloud or self-hosted)
2. FFmpeg installed on the N8N server
3. Node.js with file system access

### Required Credentials
1. **Google Drive OAuth2 API** credentials
2. **Telegram Bot Token**
3. **Telegram Chat ID**

## 🚀 Installation & Setup

### 1. Import Workflow
1. Copy the contents of `telegram-video-workflow.json`
2. In N8N, go to **Workflows** → **Import from File/URL**
3. Paste the JSON content and import

### 2. Configure Google Drive
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Drive API
3. Create OAuth2 credentials
4. In N8N, add credentials: **Google Drive OAuth2 API**
5. Use the credentials in the "Search Videos in Google Drive" node

### 3. Setup Telegram Bot
1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Get your bot token
3. Get your chat ID (use [@userinfobot](https://t.me/userinfobot))
4. Update the "Set Telegram Config" node with your credentials:
   ```json
   {
     "botToken": "YOUR_BOT_TOKEN_HERE",
     "chatId": "YOUR_CHAT_ID_HERE"
   }
   ```

### 4. Install FFmpeg on N8N Server
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install epel-release
sudo yum install ffmpeg

# Docker (if using N8N in Docker)
# Add to your Dockerfile or docker-compose:
RUN apt-get update && apt-get install -y ffmpeg
```

## 🔄 Workflow Process

### 1. **Video Search** 📁
- Searches Google Drive for video files
- Filters by MIME type (video/*)
- Excludes trashed files

### 2. **Binary Download** ⬇️
- Downloads video as binary data
- Uses Google Drive API with proper authentication
- Handles large files with extended timeout

### 3. **FFmpeg Processing** ⚙️
- **Faststart**: Moves moov atom to beginning (`-movflags +faststart`)
- **Codec Optimization**: Ensures H.264/AAC compatibility
- **Streaming Ready**: Optimizes for progressive download
- **Error Handling**: Comprehensive error catching and cleanup

### 4. **Thumbnail Generation** 🖼️
- Extracts frame at 1-second mark
- High quality JPEG output
- Optional (workflow continues if thumbnail fails)

### 5. **Telegram Delivery** 📱
- Sends video with `supports_streaming: true`
- Includes file size and optimization info
- Optional thumbnail with interactive buttons
- Smart captions with emojis and hashtags

## 📊 Workflow Nodes Breakdown

| Node | Type | Purpose |
|------|------|---------|
| **Manual Trigger** | Trigger | Start the workflow |
| **Search Videos** | Google Drive | Find videos in Drive |
| **Download Binary** | HTTP Request | Get video file data |
| **Process Video** | Code (Node.js) | FFmpeg processing |
| **Has Thumbnail?** | If | Check if thumbnail exists |
| **Send Video** | HTTP Request | Telegram video upload |
| **Send Thumbnail** | HTTP Request | Optional thumbnail |
| **Processing Summary** | Code | Log results |

## ⚙️ Configuration Options

### Google Drive Search Query
Modify the search query in "Search Videos in Google Drive":
```
mimeType contains 'video/' and trashed = false
```

Add additional filters:
```
# Specific folder
parents in 'FOLDER_ID' and mimeType contains 'video/'

# File size limit
mimeType contains 'video/' and size < 100000000

# Modified date
mimeType contains 'video/' and modifiedTime > '2024-01-01'
```

### FFmpeg Options
Customize video processing in the "Process Video with FFmpeg" node:
```bash
# Current command:
ffmpeg -i input.mp4 -c:v libx264 -c:a aac -preset fast -movflags +faststart output.mp4

# Alternative options:
# Higher compression: -preset slow -crf 23
# Different resolution: -vf scale=1280:720
# Audio bitrate: -b:a 128k
```

### Telegram Message Customization
Edit the caption template in "Send Video to Telegram":
```javascript
const caption = `🎬 ${originalName}

📁 Size: ${sizeInMB} MB
⚡ Optimized for streaming
🎯 Ready for inline playback

#video #streaming #optimized`;
```

## 🔍 Troubleshooting

### Common Issues

#### 1. FFmpeg Not Found
**Error**: `ffmpeg: command not found`
**Solution**: Install FFmpeg on your N8N server (see installation section)

#### 2. Google Drive Permission Denied
**Error**: `403 Forbidden` or `Insufficient permissions`
**Solution**: 
- Check OAuth2 scope includes Drive access
- Verify credentials are properly configured
- Ensure the bot has access to the target folder

#### 3. Telegram File Size Limit
**Error**: `Request entity too large`
**Solution**: 
- Telegram has a 50MB limit for bots
- Add file size filtering in Google Drive search
- Compress videos further with FFmpeg

#### 4. Video Won't Play Inline
**Issue**: Video uploads but doesn't stream inline
**Solution**:
- Ensure `supports_streaming: true` is set
- Verify `faststart` flag is applied
- Check video codec (must be H.264)
- Confirm sending as Video, not Document

### Debug Tips

1. **Enable Node Execution Data**: Check intermediate results
2. **FFmpeg Logs**: Review stderr output in processing node
3. **Telegram API Response**: Check response from video upload
4. **File Validation**: Verify binary data integrity

## 📝 Customization Examples

### 1. Add Video Quality Selection
```javascript
// In FFmpeg processing node, add quality options
const quality = $json.quality || 'medium';
const qualitySettings = {
  'high': '-crf 18 -preset slow',
  'medium': '-crf 23 -preset medium', 
  'low': '-crf 28 -preset fast'
};
const ffmpegCmd = `ffmpeg -i "${inputPath}" -c:v libx264 -c:a aac ${qualitySettings[quality]} -movflags +faststart -y "${outputPath}"`;
```

### 2. Batch Processing Multiple Videos
```javascript
// Modify the workflow to process all videos found
// Instead of single item, loop through all search results
for (const video of searchResults) {
  // Process each video...
}
```

### 3. Add Progress Notifications
```javascript
// Send progress updates to Telegram during processing
const progressMessage = `🔄 Processing: ${filename}\n⏳ Step: ${currentStep}`;
// Send via Telegram API
```

## 🔐 Security Considerations

1. **Credentials**: Store sensitive data in N8N credentials, never in workflow
2. **File Cleanup**: Temporary files are automatically deleted
3. **Access Control**: Limit Google Drive folder permissions
4. **Bot Security**: Use appropriate Telegram bot privacy settings

## 📚 Additional Resources

- [N8N Documentation](https://docs.n8n.io/)
- [Google Drive API](https://developers.google.com/drive/api)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this workflow.

## 📄 License

This project is open source. See the LICENSE file for details.

---

**Made with ❤️ for seamless video streaming in Telegram**