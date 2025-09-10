# Troubleshooting Guide

## 🔧 Common Issues and Solutions

### 1. Installation Issues

#### Docker Installation Failed
```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker service
sudo systemctl restart docker

# Check Docker permissions
sudo usermod -aG docker $USER
# Then logout and login again
```

#### FFmpeg Not Found
```bash
# Manual FFmpeg installation
sudo apt update
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
which ffmpeg
```

#### Permission Denied Errors
```bash
# Fix script permissions
chmod +x install.sh
chmod +x scripts/*.sh

# Fix temp directory permissions
sudo chmod 777 /tmp
```

### 2. N8N Workflow Issues

#### Workflow Import Failed
- **Solution**: Check JSON syntax using online JSON validator
- **Alternative**: Copy workflow content directly in N8N editor
- **Check**: Ensure N8N version compatibility

#### Google Drive Authentication Failed
1. Verify OAuth credentials in Google Cloud Console
2. Check redirect URIs: `https://your-n8n-instance.com/rest/oauth2-credential/callback`
3. Ensure Google Drive API is enabled
4. Test credentials outside N8N first

#### Telegram Bot Not Responding
```bash
# Test bot token
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"

# Check webhook status
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Get chat ID
# Send message to your bot and check:
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
```

### 3. Video Processing Issues

#### FFmpeg Processing Failed

**Check FFmpeg logs:**
```bash
# Enable verbose logging in N8N
export N8N_LOG_LEVEL=debug

# Test FFmpeg manually
ffmpeg -i input.mp4 -movflags +faststart -c copy output.mp4
```

**Common FFmpeg errors:**
- `Unknown encoder 'libx264'` → Install full FFmpeg build
- `Permission denied` → Check temp directory permissions  
- `File not found` → Verify file paths and existence

#### Video Too Large for Telegram
```bash
# Check file size
ls -lh /tmp/video_file.mp4

# Compress video more aggressively
ffmpeg -i input.mp4 -crf 28 -preset fast -movflags +faststart output.mp4

# Calculate target bitrate for 50MB limit
# bitrate = (50MB * 8) / duration_in_seconds
```

#### Thumbnail Generation Failed
```bash
# Test thumbnail generation
ffmpeg -i video.mp4 -ss 00:00:01 -vframes 1 -q:v 2 thumbnail.jpg

# Alternative timestamp
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 -q:v 2 thumbnail.jpg

# Check video duration first
ffprobe -v quiet -show_entries format=duration -of csv="p=0" video.mp4
```

### 4. Docker Issues

#### Container Won't Start
```bash
# Check Docker logs
docker-compose logs n8n
docker-compose logs postgres

# Check resource usage
docker stats

# Restart containers
docker-compose down
docker-compose up -d
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U n8n

# Reset database (WARNING: This deletes all data)
docker-compose down -v
docker-compose up -d
```

#### Out of Disk Space
```bash
# Check disk usage
df -h

# Clean Docker system
docker system prune -a

# Clean old volumes
docker volume prune
```

### 5. Performance Issues

#### Slow Video Processing
1. **Reduce video quality**:
   ```bash
   # Lower CRF value (higher compression)
   ffmpeg -i input.mp4 -crf 28 -preset ultrafast -movflags +faststart output.mp4
   ```

2. **Use faster preset**:
   ```bash
   # Change preset from 'medium' to 'fast' or 'ultrafast'
   -preset ultrafast
   ```

3. **Process smaller segments**:
   ```javascript
   // In N8N Code node - split large files
   if (fileSize > 100 * 1024 * 1024) { // 100MB
     // Skip or compress more aggressively
   }
   ```

#### High Memory Usage
- **Monitor Docker memory**: `docker stats`
- **Limit container memory**: Add to docker-compose.yml:
  ```yaml
  deploy:
    resources:
      limits:
        memory: 2G
  ```

#### N8N Execution Timeout
```javascript
// Increase timeout in Execute Command nodes
{
  "timeout": 1800000  // 30 minutes
}
```

### 6. Network Issues

#### Webhook Not Receiving Data
1. **Check firewall settings**
2. **Verify webhook URL** in N8N and Telegram
3. **Test webhook manually**:
   ```bash
   curl -X POST "your-n8n-webhook-url" \
        -H "Content-Type: application/json" \
        -d '{"test": "data"}'
   ```

#### Google Drive API Quota Exceeded
- **Check API usage** in Google Cloud Console
- **Implement rate limiting** in N8N workflow
- **Use exponential backoff** for retries

### 7. Debugging Tools

#### Enable Debug Logging
```bash
# In docker-compose.yml
environment:
  - N8N_LOG_LEVEL=debug
  - N8N_LOG_OUTPUT=console
```

#### Monitor Workflow Execution
1. Open N8N executions panel
2. Check execution details for each node
3. Review error messages and data flow

#### Test Components Individually

**Test Google Drive:**
```bash
# Use N8N's Google Drive node in test mode
# Verify folder access and file listing
```

**Test FFmpeg:**
```bash
# Run test script
./scripts/test-video-processing.sh
```

**Test Telegram:**
```bash
# Send test message
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
     -d "chat_id=<CHAT_ID>&text=Test message"
```

### 8. Recovery Procedures

#### Restore from Backup
```bash
# Backup current state
docker-compose exec postgres pg_dump -U n8n n8n > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U n8n n8n < backup.sql
```

#### Reset Everything
```bash
# Complete reset (WARNING: Deletes all data)
docker-compose down -v
docker system prune -a
rm -rf docker-data/
git checkout .env.example
cp .env.example .env
# Edit .env with your settings
./install.sh
```

#### Emergency File Cleanup
```bash
# Clean temp files
find /tmp -name "*video*" -type f -mtime +1 -delete
find /tmp -name "*thumbnail*" -type f -mtime +1 -delete

# Clean Docker volumes
docker volume ls -q | grep telegram-video | xargs docker volume rm
```

### 9. Getting Help

#### Collect Debug Information
```bash
# System info
uname -a
docker version
docker-compose version
ffmpeg -version

# Service status
docker-compose ps
docker-compose logs --tail=50

# Disk space
df -h
```

#### Log Analysis
```bash
# Search for specific errors
docker-compose logs | grep -i error
docker-compose logs | grep -i failed

# Export logs
docker-compose logs > debug_logs.txt
```

#### Performance Metrics
```bash
# Resource usage
docker stats --no-stream
free -h
top
```

### 10. Prevention Tips

1. **Regular Monitoring**:
   - Set up log rotation
   - Monitor disk space
   - Check API quotas

2. **Maintenance Schedule**:
   - Weekly: Clean temp files
   - Monthly: Update Docker images
   - Quarterly: Review and optimize workflows

3. **Backup Strategy**:
   - Daily: Backup N8N workflows
   - Weekly: Backup database
   - Monthly: Full system backup

4. **Resource Management**:
   - Set appropriate timeouts
   - Implement file size limits
   - Use efficient FFmpeg settings

---

## 📞 Support Channels

- **Documentation**: README.md
- **GitHub Issues**: [Create an issue](https://github.com/upterza000/telegram-manager-updater/issues)
- **N8N Community**: [N8N Community Forum](https://community.n8n.io/)
- **FFmpeg Documentation**: [FFmpeg Official Docs](https://ffmpeg.org/documentation.html)