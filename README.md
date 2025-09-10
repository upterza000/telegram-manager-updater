# Telegram Manager Updater

Agent/N8N Flow สำหรับประมวลผลและส่งวิดีโอไปยัง Telegram พร้อมรองรับการเล่นแบบ inline

## ฟีเจอร์หลัก

- 🔍 ค้นหาวิดีโอใน Google Drive
- 📥 ดาวน์โหลดวิดีโอเป็น Binary
- 🎬 จัดรูปแบบไฟล์ให้เล่น inline ได้ (ffmpeg faststart)
- 🖼️ สร้างปก (thumbnail) อัตโนมัติ
- 📁 รองรับไฟล์ใหญ่เกิน 50MB
- 📲 ส่งไปยัง Telegram แบบ "Send Video + Supports Streaming"

## การติดตั้ง

1. Clone repository
```bash
git clone https://github.com/upterza000/telegram-manager-updater.git
cd telegram-manager-updater
```

2. ติดตั้ง dependencies
```bash
npm install
```

3. ตั้งค่า environment variables
```bash
cp .env.example .env
# แก้ไข .env ตามค่าที่ต้องการ
```

4. รันแอปพลิเคชัน
```bash
npm start
```

## การกำหนดค่า

สร้างไฟล์ `.env` และกำหนดค่าต่อไปนี้:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
GOOGLE_SERVICE_ACCOUNT_KEY=path_to_service_account_key.json
MAX_FILE_SIZE=52428800
FFMPEG_PATH=/usr/bin/ffmpeg
```

## วิธีใช้งาน

### N8N Workflow

import workflow จากไฟล์ `workflows/telegram-video-manager.json` เข้าไปใน N8N

### การใช้งานผ่าน API

```javascript
// ส่งวิดีโอไปยัง Telegram
POST /api/process-video
{
  "videoUrl": "https://drive.google.com/file/d/...",
  "chatId": "telegram_chat_id",
  "caption": "Video caption",
  "buttons": [
    {"text": "ดูเพิ่มเติม", "url": "https://example.com"}
  ]
}
```

## สิ่งสำคัญสำหรับ Inline Playback

เพื่อให้วิดีโอเล่นได้ทันทีใน Telegram:
- ส่งเป็น Video (ไม่ใช่ Document)
- ไฟล์ต้องมี moov atom อยู่หัวไฟล์ (`-movflags +faststart`)
- รองรับ format: MP4, MOV, AVI

## License

MIT License