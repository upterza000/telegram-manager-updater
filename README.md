# Telegram Video Manager - N8N Workflow

🎬 **อัตโนมัติการจัดการวิดีโอจาก Google Drive ส่งไปยัง Telegram พร้อมรองรับการเล่นแบบ Streaming**

## ✨ ฟีเจอร์หลัก

- 🔍 **ตรวจจับวิดีโอใหม่** ใน Google Drive โฟลเดอร์อัตโนมัติ
- 📥 **ดาวน์โหลดไฟล์** เป็น Binary Data
- ⚡ **ประมวลผลด้วย FFmpeg** เพื่อให้เล่นใน Telegram ได้ทันที (Faststart)
- 🖼️ **สร้าง Thumbnail** อัตโนมัติ
- 📱 **ส่งไปยัง Telegram** พร้อม Streaming Support
- 🎛️ **ปุ่ม Interactive** สำหรับจัดการไฟล์
- 🧹 **ล้างไฟล์ชั่วคราว** อัตโนมัติ

## 🔧 การติดตั้งและตั้งค่า

### 1. ข้อกำหนดเบื้องต้น

- N8N Server (Self-hosted หรือ Cloud)
- FFmpeg ติดตั้งบน Server
- Google Drive API Access
- Telegram Bot Token

### 2. ติดตั้ง FFmpeg

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg

# macOS
brew install ffmpeg

# ตรวจสอบการติดตั้ง
ffmpeg -version
```

### 3. สร้าง Telegram Bot

1. ไปที่ [@BotFather](https://t.me/botfather) บน Telegram
2. สร้างบอทใหม่ด้วยคำสั่ง `/newbot`
3. ตั้งชื่อบอทและรับ Bot Token
4. เปิดใช้งาน Inline Mode (ถ้าต้องการ)

### 4. ตั้งค่า Google Drive API

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่หรือเลือก Project ที่มีอยู่
3. เปิดใช้งาน Google Drive API
4. สร้าง OAuth 2.0 Credentials
5. เพิ่ม Redirect URI: `https://your-n8n-instance.com/rest/oauth2-credential/callback`

### 5. Import Workflow ลงใน N8N

1. เข้าสู่ N8N Dashboard
2. คลิก **Import from file**
3. เลือกไฟล์ `n8n-video-telegram-workflow.json`
4. หรือ Copy JSON และ Paste ใน N8N

### 6. ตั้งค่า Credentials

#### Google Drive OAuth2:
- **Name**: `Google Drive OAuth2 API`
- **Client ID**: จาก Google Cloud Console
- **Client Secret**: จาก Google Cloud Console
- **Scope**: `https://www.googleapis.com/auth/drive.readonly`

#### Telegram Bot API:
- **Name**: `Telegram Bot API` 
- **Access Token**: Bot Token จาก BotFather

### 7. กำหนดค่าการทำงาน

1. **Google Drive Trigger**:
   - เลือกโฟลเดอร์ที่ต้องการตรวจจับ
   - ตั้งเวลาตรวจสอบ (แนะนำ 5 นาที)

2. **Telegram Send Video**:
   - ใส่ Chat ID ของกลุ่มหรือช่องที่ต้องการส่ง
   - ปรับแต่ง Caption และ Buttons ตามต้องการ

## 📋 วิธีใช้งาน

### การใช้งานอัตโนมัติ

1. อัปโหลดไฟล์วิดีโอลงในโฟลเดอร์ Google Drive ที่กำหนด
2. N8N จะตรวจจับไฟล์ใหม่อัตโนมัติ
3. ดาวน์โหลดและประมวลผลไฟล์
4. ส่งไปยัง Telegram พร้อม Streaming Support

### ปุ่มและคำสั่งใน Telegram

- 📂 **เปิด Google Drive**: เปิดไฟล์ต้นฉบับใน Google Drive
- ⬇️ **ดาวน์โหลด**: ดาวน์โหลดไฟล์โดยตรง
- 🔄 **ประมวลผลใหม่**: ประมวลผลไฟล์อีกครั้ง (ผ่าน Webhook)

## ⚙️ การปรับแต่งขั้นสูง

### FFmpeg Parameters

Workflow ใช้พารามิเตอร์ต่อไปนี้เพื่อให้วิดีโอเล่นได้ทันทีใน Telegram:

```bash
ffmpeg -i input.mp4 -movflags +faststart -c copy -avoid_negative_ts make_zero output.mp4
```

- `+faststart`: ย้าย moov atom ไปไว้หน้าไฟล์
- `-c copy`: Copy streams โดยไม่ re-encode (เร็วกว่า)
- `-avoid_negative_ts make_zero`: แก้ไขปัญหา timestamp

### Thumbnail Generation

```bash
ffmpeg -i input.mp4 -ss 00:00:01.000 -vframes 1 -q:v 2 thumbnail.jpg
```

- `-ss 00:00:01.000`: จับภาพที่วินาทีที่ 1
- `-vframes 1`: สร้างเฟรมเดียว
- `-q:v 2`: คุณภาพสูง (1-31, ต่ำกว่า = ดีกว่า)

### Environment Variables

สร้างไฟล์ `.env` สำหรับการตั้งค่า:

```env
# Telegram Settings
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Google Drive Settings  
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here

# Processing Settings
FFMPEG_QUALITY=medium
THUMBNAIL_TIME=00:00:01.000
CLEANUP_ENABLED=true

# Webhook Settings (Optional)
WEBHOOK_URL=https://your-n8n-instance.com/webhook/telegram-webhook
```

## 🔍 การ Debug และแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **วิดีโอไม่เล่นใน Telegram**:
   - ตรวจสอบว่า FFmpeg ทำ faststart สำเร็จ
   - ตรวจสอบว่าส่งเป็น Video ไม่ใช่ Document

2. **FFmpeg ไม่ทำงาน**:
   ```bash
   # ตรวจสอบ FFmpeg
   which ffmpeg
   ffmpeg -version
   
   # ตรวจสอบ permissions
   ls -la /tmp/
   ```

3. **Google Drive API Error**:
   - ตรวจสอบ OAuth Scope
   - ตรวจสอบ Folder Permissions

### Log Monitoring

เปิด Debug Mode ใน N8N:

```bash
export N8N_LOG_LEVEL=debug
```

## 📊 การตรวจสอบประสิทธิภาพ

### Execution Statistics

N8N จะแสดงข้อมูลการทำงานของแต่ละ Node:

- **Google Drive**: เวลาในการดาวน์โหลด
- **FFmpeg**: เวลาในการประมวลผล
- **Telegram**: เวลาในการอัปโหลด

### การปรับแต่งประสิทธิภาพ

1. **ขนาดไฟล์**:
   ```bash
   # จำกัดขนาดไฟล์ (50MB สำหรับ Telegram Bot API)
   -fs 50M
   ```

2. **คุณภาพวิดีโอ**:
   ```bash
   # ลดคุณภาพหากไฟล์ใหญ่เกินไป
   -crf 23 -preset medium
   ```

## 🤝 การสนับสนุนและชุมชน

- 📖 [N8N Documentation](https://docs.n8n.io/)
- 🤖 [Telegram Bot API](https://core.telegram.org/bots/api)
- 🎬 [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

## 📄 License

MIT License - ดูรายละเอียดในไฟล์ LICENSE

## 🔄 Version History

- **v1.1.0**: เพิ่ม Webhook Support และ Interactive Buttons
- **v1.0.0**: Release แรก - Basic Video Processing Pipeline

---

> 💡 **เคล็ดลับ**: การใช้ `+faststart` คือกุญแจสำคัญในการทำให้วิดีโอเล่นได้ทันทีใน Telegram โดยไม่ต้องดาวน์โหลดทั้งไฟล์ก่อน