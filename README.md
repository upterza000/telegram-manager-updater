# Telegram Video Manager with Streaming Support

## Overview

This n8n workflow automatically processes videos from Google Drive and sends them to Telegram with full streaming support. The workflow ensures videos can be played inline in Telegram by processing them with FFmpeg to add the `faststart` flag.

## Features

- 🔍 **Video Search**: Automatically searches for video files in Google Drive
- 📥 **Binary Download**: Downloads videos as binary data for processing
- ⚡ **FFmpeg Processing**: Adds `movflags +faststart` for inline streaming support
- 📱 **Large File Support**: Handles videos over 50MB
- 🎥 **Telegram Integration**: Sends as Video (not Document) with streaming support
- 🏷️ **Rich Captions**: Includes file information and custom buttons
- 🔘 **Interactive Buttons**: Quick access to original Drive file and download links

## Key Technical Features

### Inline Video Streaming
- Videos are processed with `ffmpeg -movflags +faststart` to move the moov atom to the beginning of the file
- This enables instant playback in Telegram without full download
- Videos are sent as "Video" type (not Document) to enable inline player

### Large File Handling
- Automatically detects files larger than 50MB
- Uses appropriate Telegram API methods for large file uploads
- Maintains streaming capability regardless of file size

## Workflow Nodes

1. **Manual Trigger** - Start the workflow manually
2. **Search Videos in Drive** - Find video files using Google Drive API
3. **Download Video Binary** - Download video content as binary data
4. **Prepare Video Processing** - Set up temporary files for FFmpeg
5. **Apply FFmpeg Processing** - Process video with faststart flag
6. **Prepare Telegram Data** - Format data for Telegram API
7. **Check File Size > 50MB** - Route based on file size
8. **Send Large/Regular Video to Telegram** - Send with appropriate method

## Setup Instructions

### 1. Import the Workflow
- Copy the content of `telegram-video-workflow.json`
- In n8n, go to Workflows → Import from JSON
- Paste the workflow content

### 2. Configure Google Drive Connection
- Set up Google Drive credentials in n8n
- Ensure the following scopes are enabled:
  - `https://www.googleapis.com/auth/drive.readonly`
  - `https://www.googleapis.com/auth/drive.file`

### 3. Configure Telegram Bot
- Create a Telegram bot via [@BotFather](https://t.me/botfather)
- Get your bot token
- Add Telegram credentials in n8n with your bot token
- Set the `TELEGRAM_CHAT_ID` environment variable or update the workflow code

### 4. Install FFmpeg
Ensure FFmpeg is installed on your n8n server:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Docker (add to your n8n Dockerfile)
RUN apt-get update && apt-get install -y ffmpeg
```

### 5. Configure Environment Variables
Set the following environment variable:
- `TELEGRAM_CHAT_ID`: Your Telegram channel/chat ID (e.g., `@your_channel` or `-1001234567890`)

## Workflow Configuration

### Search Query Customization
Modify the Google Drive search node to target specific folders:
```javascript
// Search in specific folder
"queryString": "parents in 'FOLDER_ID' and mimeType contains 'video/' and trashed = false"

// Search with name patterns
"queryString": "name contains 'keyword' and mimeType contains 'video/' and trashed = false"
```

### Caption Customization
Edit the caption template in the Telegram nodes:
```javascript
"caption": "🎥 {{ $json.name }}\n📁 จาก Google Drive\n✅ รองรับการสตรีม"
```

### Button Customization
Modify the inline keyboard in Telegram nodes:
```javascript
"replyMarkup": {
  "inlineKeyboard": [
    [
      {
        "text": "📱 เปิดใน Telegram",
        "url": "https://t.me/share/url?url={{ encodeURIComponent($json.webViewLink) }}"
      }
    ]
  ]
}
```

## File Size Considerations

- **Files < 50MB**: Standard Telegram video upload
- **Files > 50MB**: Uses Telegram's large file upload method
- **Maximum size**: Telegram supports up to 2GB for video files
- All files maintain streaming capability regardless of size

## Troubleshooting

### FFmpeg Issues
If FFmpeg processing fails, the workflow will use the original video file. Check:
- FFmpeg installation
- File permissions in `/tmp` directory
- Available disk space

### Telegram Upload Failures
- Verify bot token and permissions
- Check chat ID format
- Ensure file doesn't exceed Telegram limits (2GB)
- Verify MIME type is properly set

### Drive API Issues
- Check Google Drive API credentials
- Verify folder permissions
- Ensure proper OAuth scopes

## Supported Video Formats

The workflow supports all video formats that:
- Are supported by FFmpeg for processing
- Can be uploaded to Telegram (MP4, AVI, MOV, etc.)
- Are under Telegram's 2GB limit

## Performance Notes

- Processing time depends on video file size and server performance
- FFmpeg processing adds ~10-30 seconds depending on file size
- Large files may take several minutes to upload to Telegram
- Temporary files are automatically cleaned up after processing

## Security Considerations

- Temporary files are stored in `/tmp` and cleaned up automatically
- Google Drive credentials should use minimal required permissions
- Telegram bot token should be kept secure
- Consider file size limits to prevent server overload

## License

This workflow is provided as-is for educational and practical use. Ensure compliance with Google Drive and Telegram API terms of service.