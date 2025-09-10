# n8n Telegram Video Workflow Summary

## ไฟล์ที่สร้าง (Created Files)

### 1. `telegram-video-workflow.json`
ไฟล์ workflow หลักของ n8n ที่ครอบคลุมทุกความต้องการ:

#### ฟีเจอร์หลัก (Main Features):
- ✅ **ค้นหาวิดีโอใน Google Drive** - ใช้ Google Drive API ค้นหาไฟล์วิดีโอ
- ✅ **ดาวน์โหลดเป็น Binary** - ดาวน์โหลดไฟล์วิดีโอเป็นข้อมูล binary
- ✅ **ประมวลผลด้วย FFmpeg** - เพิ่ม `faststart` flag เพื่อให้เล่นแบบ inline ได้
- ✅ **รองรับไฟล์ใหญ่** - จัดการไฟล์เกิน 50MB ได้
- ✅ **ส่งไป Telegram** - ส่งเป็น Video พร้อม streaming support
- ✅ **แคปชันและปุ่ม** - มีข้อมูลไฟล์และปุ่มสำหรับการเข้าถึง

#### โครงสร้าง Workflow (Workflow Structure):
1. **Manual Trigger** - เริ่มต้น workflow
2. **Search Videos in Drive** - ค้นหาวิดีโอ
3. **Download Video Binary** - ดาวน์โหลดข้อมูล
4. **Prepare Video Processing** - เตรียมไฟล์สำหรับ FFmpeg
5. **Apply FFmpeg Processing** - ประมวลผลด้วย `-movflags +faststart`
6. **Prepare Telegram Data** - จัดรูปแบบข้อมูล
7. **Check File Size > 50MB** - ตรวจสอบขนาดไฟล์
8. **Send Video to Telegram** - ส่งไฟล์ (แยกเป็น 2 เส้นทางสำหรับไฟล์เล็ก/ใหญ่)

### 2. `README.md`
คู่มือการใช้งานฉบับสมบูรณ์ภาษาอังกฤษ ประกอบด้วย:
- คำแนะนำการติดตั้งและตั้งค่า
- วิธีการ import workflow
- การตั้งค่า Google Drive และ Telegram
- การแก้ไขปัญหา
- ตัวอย่างการปรับแต่ง

## คุณสมบัติพิเศษ (Special Features)

### 🎥 Inline Video Streaming
- ใช้ `ffmpeg -movflags +faststart` เพื่อย้าย moov atom ไปไว้หัวไฟล์
- ทำให้วิดีโอเล่นได้ทันทีใน Telegram โดยไม่ต้องดาวน์โหลดครบ
- ส่งเป็น "Video" (ไม่ใช่ Document) เพื่อเปิดใช้ inline player

### 📦 Large File Support  
- ตรวจจับไฟล์ใหญ่กว่า 50MB โดยอัตโนมัติ
- ใช้ Telegram API method ที่เหมาะสมสำหรับไฟล์ขนาดใหญ่
- รักษาความสามารถในการ streaming ไว้ไม่ว่าไฟล์จะใหญ่แค่ไหน

### 🛠️ Error Handling
- หาก FFmpeg ประมวลผลไม่สำเร็จ จะใช้ไฟล์ต้นฉบับ
- ลบไฟล์ชั่วคราวโดยอัตโนมัติ
- มี fallback สำหรับทุกขั้นตอน

### 🎯 Smart Formatting
- แคปชันแสดงข้อมูลไฟล์แบบละเอียด
- ปุ่ม inline keyboard สำหรับเข้าถึงไฟล์ต้นฉบับ
- รองรับการแสดงผลข้อมูล metadata ของวิดีโอ

## การใช้งาน (Usage)

1. **Import**: นำ `telegram-video-workflow.json` ไป import ใน n8n
2. **Setup**: ตั้งค่า Google Drive และ Telegram credentials
3. **Configure**: ปรับแต่งการค้นหาและ chat ID
4. **Run**: รันด้วย Manual Trigger

## ข้อกำหนดระบบ (System Requirements)

- n8n server พร้อม Google Drive และ Telegram integrations
- FFmpeg ติดตั้งบนเซิร์ฟเวอร์
- Google Drive API credentials
- Telegram Bot Token

## ความปลอดภัย (Security)

- ไฟล์ชั่วคราวจัดเก็บใน `/tmp` และลบอัตโนมัติ
- ใช้ minimal permissions สำหรับ Google Drive
- รักษาความปลอดภัยของ Bot Token

---

**หมายเหตุ**: Workflow นี้สร้างขึ้นตามความต้องการเฉพาะเพื่อให้วิดีโอจาก Google Drive สามารถเล่นแบบ inline ใน Telegram ได้โดยการประมวลผลด้วย FFmpeg เพื่อเพิ่ม faststart flag และส่งเป็น Video type พร้อม streaming support