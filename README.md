# Telegram Manager Updater

A comprehensive Node.js application for processing videos from Google Drive and sending them to Telegram with streaming support. This application includes N8N workflow automation for seamless video processing.

## Features

- 🎥 **Video Processing**: Automatically process videos with FFmpeg for optimal streaming
- 📱 **Telegram Integration**: Send videos with streaming support and inline keyboards
- 🔍 **Google Drive Integration**: Search and download videos from Google Drive folders
- 📏 **Large File Support**: Handle files larger than 50MB with compression
- 🖼️ **Thumbnail Generation**: Automatically generate video thumbnails
- 🤖 **N8N Workflow**: Ready-to-use workflow for automation
- 🐳 **Docker Support**: Containerized deployment
- ⚡ **Fast Start**: FFmpeg faststart for immediate streaming playback

## Requirements

- Node.js 18+ 
- FFmpeg (installed automatically in Docker)
- Google Drive API credentials
- Telegram Bot Token

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Google Drive Configuration  
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id_here
GOOGLE_DRIVE_CREDENTIALS_PATH=./config/google-credentials.json

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 2. Google Drive Setup

1. Create a service account in Google Cloud Console
2. Enable Google Drive API
3. Download the credentials JSON file
4. Place it in `config/google-credentials.json`
5. Share your Google Drive folder with the service account email

### 3. Telegram Bot Setup

1. Create a bot using [@BotFather](https://t.me/botfather)
2. Get the bot token and add it to `.env`
3. Get your chat ID and add it to `.env`

### 4. Installation & Running

#### Using Docker (Recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Using Node.js

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server  
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Search Videos
```
GET /search-videos?folderId=your_folder_id
```

### Process Video
```
POST /process-video
{
  "fileId": "google_drive_file_id",
  "caption": "Video caption",
  "buttons": [
    [{"text": "👍 Like", "callback_data": "like_123"}]
  ]
}
```

### Auto Process Workflow
```
POST /workflow/auto-process
{
  "folderId": "google_drive_folder_id",
  "chatId": "telegram_chat_id"
}
```

## N8N Workflow

The included N8N workflow (`src/workflows/video-processing-workflow.json`) provides:

1. **Webhook Trigger**: Starts the workflow via HTTP request
2. **Google Drive Search**: Finds video files in specified folder
3. **Video Processing**: Downloads, processes, and optimizes videos
4. **Thumbnail Generation**: Creates video thumbnails automatically
5. **Telegram Delivery**: Sends videos with streaming support
6. **Error Handling**: Comprehensive error handling and logging

### Import to N8N

1. Open your N8N instance
2. Go to Workflows → Import from File
3. Select `src/workflows/video-processing-workflow.json`
4. Configure your credentials and settings
5. Activate the workflow

### Triggering the Workflow

Send a GET request to your N8N webhook:
```
GET https://your-n8n-instance.com/webhook/video-trigger?folderId=your_folder_id
```

## Video Processing Pipeline

1. **Search Phase**: 
   - Scan Google Drive folder for video files
   - Filter by supported formats (MP4, AVI, MOV, MKV)
   - Sort by modification date

2. **Download Phase**:
   - Download videos as binary data
   - Handle large files (>50MB) with streaming
   - Progress tracking and logging

3. **Processing Phase**:
   - FFmpeg processing with faststart for streaming
   - Video compression if needed (Telegram 50MB limit)
   - Quality optimization (configurable)

4. **Thumbnail Phase**:
   - Generate thumbnail at 10% video duration
   - Resize to optimal dimensions (320x240)
   - JPEG format optimization

5. **Delivery Phase**:
   - Upload to Telegram with streaming support
   - Add custom captions and inline keyboards
   - Clean up temporary files

## Configuration

### Video Processing Settings

```env
VIDEO_QUALITY=720p          # Video resolution (240p, 360p, 480p, 720p, 1080p)
THUMBNAIL_SIZE=320x240      # Thumbnail dimensions
FASTSTART=true             # Enable faststart for streaming
MAX_FILE_SIZE=209715200    # Max processing file size (200MB)
```

### FFmpeg Settings

The application uses optimized FFmpeg settings:

- **Codec**: H.264 for video, AAC for audio
- **Quality**: CRF 23 for balanced quality/size
- **Bitrate**: Adaptive with 2Mbps max rate
- **Preset**: Medium for speed/quality balance
- **Faststart**: Enabled for immediate playback

## File Structure

```
├── src/
│   ├── index.js                 # Main application entry
│   ├── services/
│   │   ├── videoProcessor.js    # Video processing with FFmpeg
│   │   ├── googleDriveService.js # Google Drive API integration
│   │   └── telegramService.js   # Telegram Bot API
│   ├── utils/
│   │   └── helpers.js          # Utility functions
│   └── workflows/
│       └── video-processing-workflow.json # N8N workflow
├── config/                      # Configuration files
├── temp/                       # Temporary processing files
├── Dockerfile                  # Docker container definition
├── docker-compose.yml         # Docker Compose setup
└── package.json               # Node.js dependencies
```

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Install FFmpeg: `sudo apt-get install ffmpeg`
   - Or use Docker (includes FFmpeg)

2. **Google Drive permissions**
   - Ensure service account has access to folder
   - Check credentials file path and format

3. **Telegram file size limits**
   - Videos are auto-compressed to <50MB
   - Large files may take longer to process

4. **Memory issues with large files**
   - Increase Node.js memory: `--max-old-space-size=4096`
   - Use streaming for downloads

### Logs

View application logs:
```bash
# Docker
docker-compose logs -f telegram-manager

# Node.js
npm start
```

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
DEBUG=telegram-manager:*
```

## Performance

- **Concurrent Processing**: Single video at a time to prevent memory issues
- **File Cleanup**: Automatic cleanup of temporary files
- **Memory Management**: Streaming for large file handling
- **Compression**: Adaptive bitrate based on file size

## Security

- Service account authentication for Google Drive
- Environment variables for sensitive data
- Input validation and sanitization
- File type validation
- Size limits for uploads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs for error messages
3. Open an issue on GitHub
4. Provide environment details and error logs