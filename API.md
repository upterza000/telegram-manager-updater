# API Documentation

## Overview

The Telegram Manager Updater provides RESTful APIs for processing videos and sending them to Telegram with inline streaming support.

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### 1. Process Video

**POST** `/api/process-video`

Process a video from Google Drive and send it to Telegram with streaming optimization.

#### Request Body
```json
{
  "videoUrl": "https://drive.google.com/file/d/FILE_ID/view",
  "chatId": "telegram_chat_id",
  "caption": "Optional video caption",
  "buttons": [
    {
      "text": "Button text",
      "url": "https://example.com"
    }
  ],
  "options": {
    "thumbnailTime": 5,
    "quality": "medium"
  }
}
```

#### Response
```json
{
  "success": true,
  "jobId": "job_1234567890_abc123",
  "message": "Video processing started",
  "statusUrl": "/api/status/job_1234567890_abc123"
}
```

### 2. Search Videos

**POST** `/api/search-videos`

Search for videos in Google Drive.

#### Request Body
```json
{
  "query": "video name or keyword",
  "folderId": "optional_folder_id",
  "limit": 10
}
```

#### Response
```json
{
  "success": true,
  "videos": [
    {
      "id": "google_drive_file_id",
      "name": "video_name.mp4",
      "size": 1024000,
      "sizeFormatted": "1.02 MB",
      "mimeType": "video/mp4",
      "modifiedTime": "2024-01-01T00:00:00.000Z",
      "downloadUrl": "https://drive.google.com/uc?id=...",
      "thumbnailLink": "https://..."
    }
  ]
}
```

### 3. Job Status

**GET** `/api/status/{jobId}`

Get the status of a video processing job.

#### Response
```json
{
  "success": true,
  "jobId": "job_1234567890_abc123",
  "status": "processing",
  "progress": 75,
  "message": "Processing video for streaming...",
  "startTime": "2024-01-01T00:00:00.000Z",
  "lastUpdate": "2024-01-01T00:01:00.000Z",
  "duration": 60000
}
```

#### Status Values
- `started` - Job has been created
- `downloading` - Downloading video from Google Drive
- `analyzing` - Analyzing video format
- `processing` - Converting video with FFmpeg
- `thumbnail` - Generating thumbnail
- `uploading` - Sending to Telegram
- `completed` - Successfully completed
- `error` - An error occurred

### 4. Webhook Endpoint (N8N Integration)

**POST** `/webhook/process-video`

Webhook endpoint for N8N workflow integration.

#### Request Body
```json
{
  "videoUrl": "https://drive.google.com/file/d/FILE_ID/view",
  "chatId": "telegram_chat_id",
  "caption": "Video caption",
  "buttons": []
}
```

## Video Processing Features

### 🎬 FFmpeg Processing
- **Faststart Flag**: Videos are processed with `-movflags +faststart` for inline playback
- **Codec Optimization**: Uses H.264 video codec and AAC audio codec
- **Quality Control**: Configurable CRF (Constant Rate Factor) for quality vs file size

### 📱 Telegram Integration
- **Streaming Support**: Videos sent with `supports_streaming: true`
- **Large File Handling**: Files >50MB sent as documents with optimization notes
- **Thumbnail Generation**: Auto-generated thumbnails for better user experience
- **Inline Buttons**: Support for custom inline keyboard buttons

### 🔍 Google Drive Integration
- **Search**: Search videos by name, keyword, or folder
- **Download**: Binary download of video files
- **Metadata**: Extract file information and metadata

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "details": "Detailed error message"
}
```

### Common Error Codes
- `400` - Bad Request (missing required parameters)
- `404` - Not Found (job not found, file not found)
- `500` - Internal Server Error (processing errors)

## Rate Limiting

- **API Calls**: 100 requests per minute per IP
- **Video Processing**: 3 concurrent jobs maximum
- **File Size**: 2GB maximum per video

## Environment Variables

Required environment variables for API functionality:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GOOGLE_DRIVE_API_KEY=your_api_key
GOOGLE_SERVICE_ACCOUNT_KEY=path_to_service_account.json
MAX_FILE_SIZE=52428800
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
```

## Example Usage

### cURL Examples

#### Process Video
```bash
curl -X POST http://localhost:3000/api/process-video \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://drive.google.com/file/d/1234567890/view",
    "chatId": "-1001234567890",
    "caption": "Test video with streaming support"
  }'
```

#### Check Job Status
```bash
curl http://localhost:3000/api/status/job_1234567890_abc123
```

### JavaScript Example
```javascript
const axios = require('axios');

async function processVideo() {
  try {
    const response = await axios.post('http://localhost:3000/api/process-video', {
      videoUrl: 'https://drive.google.com/file/d/FILE_ID/view',
      chatId: 'YOUR_CHAT_ID',
      caption: 'My awesome video! 🎬',
      buttons: [
        { text: 'Visit Website', url: 'https://example.com' }
      ]
    });
    
    console.log('Job started:', response.data.jobId);
    
    // Check status
    const statusResponse = await axios.get(
      `http://localhost:3000/api/status/${response.data.jobId}`
    );
    
    console.log('Status:', statusResponse.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

processVideo();
```