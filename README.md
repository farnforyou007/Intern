# 🌿 Thai Traditional Medicine Personnel System (TTMED)

ระบบจัดการบุคลากร คณะการแพทย์แผนไทย มหาวิทยาลัยสงขลานครินทร์

---

## 🚀 วิธีการติดตั้งสำหรับเพื่อน (Image-based Deployment)

ถ้าคุณต้องการติดตั้งระบบโดยดึงอิมเมจจาก Docker Hub มาใช้เลย ให้ทำตามนี้ครับ:

### 1. ไฟล์ที่จำเป็น
เพื่อนคนรันต้องการแค่ 2 ไฟล์นี้ครับ (ไม่ต้องใช้ Source Code):
- `docker-compose.yml`
- `.env.local`

### 2. ตั้งค่า Environment
สร้างไฟล์ `.env.local` แล้วใส่ค่า **Secret Keys** ของเพื่อน:
```env
SUPABASE_SERVICE_ROLE_KEY=your_friend_service_role_key
LINE_CHANNEL_ACCESS_TOKEN=your_friend_line_token
```

### 3. สั่งรัน
รันคำสั่งเดียว ระบบจะดึงอิมเมจจาก Docker Hub มาให้เอง:
```bash
docker-compose up -d
```
*ระบบจะเริ่มทำงานที่ [http://localhost:3000](http://localhost:3000)*

---

## 🛠 สำหรับคนพัฒนา (Build & Push)

หากมีการแก้ไขโค้ดและต้องการอัปเดตอิมเมจขึ้น Hub:

```bash
# 1. Build ใหม่
docker build -t farnforyou/internship-system:v1 .

# 2. Push ขึ้น Hub
docker push farnforyou/internship-system:v1
```

> [!IMPORTANT]
> ค่า `NEXT_PUBLIC_` ต่างๆ ถูกฝังไว้ในอิมเมจเรียบร้อยแล้ว (URL: https://intern.ttmedpsu.org) เพื่อนไม่สามารถเปลี่ยน URL ได้จากการแก้ .env (ต้อง Build ใหม่เท่านั้น)