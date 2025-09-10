# 🚀 Quick Start Guide

Get your Telegram Video Manager up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Docker and Docker Compose installed
- [ ] Telegram bot created via [@BotFather](https://t.me/BotFather)
- [ ] Google Drive folder with videos
- [ ] Google Cloud Console project with Drive API enabled

## 1-Minute Setup

### 1. Clone & Setup
```bash
git clone https://github.com/upterza000/telegram-manager-updater.git
cd telegram-manager-updater
./setup.sh install
```

### 2. Configure Credentials
```bash
# Edit .env file with your credentials
nano .env

# Required values:
# TELEGRAM_BOT_TOKEN=your_bot_token_here
# TELEGRAM_CHAT_ID=your_chat_id_here
```

### 3. Start Services
```bash
./setup.sh start
```

### 4. Import Workflow
1. Open http://localhost:5678
2. Login with credentials from `.env`
3. Go to **Workflows** → **Import from File**
4. Upload `telegram-video-workflow.json`

### 5. Configure N8N Credentials
1. Add **Google Drive OAuth2 API** credential
2. Update **Set Telegram Config** node with your bot token and chat ID

## Test Your Setup

1. Click **Execute Workflow** in N8N
2. The workflow will:
   - Search videos in your Google Drive
   - Download and process with FFmpeg
   - Generate thumbnail
   - Send to Telegram with streaming support

## Common Issues & Solutions

### ❌ "FFmpeg not found"
```bash
# Restart container to install FFmpeg
./setup.sh restart
```

### ❌ "Google Drive permission denied"
- Check OAuth2 credentials in N8N
- Verify Drive API is enabled
- Ensure proper scope permissions

### ❌ "Telegram file too large"
- Videos must be under 50MB for bots
- Adjust FFmpeg compression settings
- Use file size filters in Drive search

### ❌ "Video won't stream inline"
- Ensure `supports_streaming: true` is set
- Verify `faststart` flag is applied
- Check video is sent as Video type, not Document

## Advanced Configuration

### Custom Video Quality
Edit the FFmpeg command in "Process Video" node:
```bash
# High quality (larger files)
-preset slow -crf 18

# Low bandwidth (smaller files)  
-preset fast -crf 28 -vf scale=854:480
```

### Folder-Specific Processing
Update Google Drive search query:
```
parents in 'YOUR_FOLDER_ID' and mimeType contains 'video/' and trashed = false
```

### Batch Processing
Enable "Execute Once" mode in workflow settings to process all found videos.

## Commands Reference

```bash
./setup.sh install    # Full installation
./setup.sh start      # Start N8N
./setup.sh stop       # Stop N8N  
./setup.sh restart    # Restart N8N
./setup.sh logs       # View logs
./setup.sh status     # Check status
```

## Need Help?

1. Check the [full README](README.md) for detailed documentation
2. Review [Google Drive queries examples](examples/google-drive-queries.md)
3. Test your setup with `node test-workflow.js`
4. Check Docker logs: `./setup.sh logs`

---

**🎬 Ready to stream! Your videos will now automatically optimize for Telegram inline playback.**