# 1. Base Image
FROM node:20-alpine AS base

# 2. Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ก๊อปปี้ไฟล์สำหรับลงโปรแกรม
COPY package.json package-lock.json* ./
# ลง dependencies ทั้งหมดรวมถึง sharp
RUN npm ci && npm install sharp

# 3. Builder
FROM base AS builder
WORKDIR /app
# ดึง node_modules มาจาก stage deps
COPY --from=deps /app/node_modules ./node_modules
# ก๊อปปี้โค้ดโปรเจคทั้งหมดเข้าเครื่อง
COPY . .

# --- ประกาศ ARG/ENV เพื่อฝังค่าลงในไฟล์ JS ตอน Build ---
# ใช้ค่าจาก .env.local เป็นค่าเริ่มต้น
ARG NEXT_PUBLIC_SUPABASE_URL=https://vvxsfibqlpkpzqyjwmuw.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eHNmaWJxbHBrcHpxeWp3bXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTk1NDgsImV4cCI6MjA4NTczNTU0OH0.BPbVXH2nqhhg_rMMWd6EMw4nTReKRDnDfUtPVRsw2RQ
ARG NEXT_PUBLIC_LIFF_ID=2009096451-rkWSBIMh
ARG NEXT_PUBLIC_JWT_SECRET=ttmed2548P\$u
ARG NEXT_PUBLIC_LOGIN_URL="https://psusso.ttmedpsu.org/login.php?app=internship"
ARG NEXT_PUBLIC_APP_URL=https://intern.ttmedpsu.org
ARG NEXT_PUBLIC_LIFF_URL=https://liff.line.me/2009096451-rkWSBIMh
ARG LINE_CHANNEL_ACCESS_TOKEN=HW8bjmeoi2pb8iHTV3Ua/tZTPS4ehVQntOKfNU2unJ5at9cnu50sZKfcSh9P+TT51Oa1gXZLYu41Ql/jBoq66ZIco7cGhX2ctHjbJKJiP+tSnWI+vvg15S+p2eBXspVROAGkGv9T3xDtcaROcXIMMAdB04t89/1O/w1cDnyilFU=
ARG SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eHNmaWJxbHBrcHpxeWp3bXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE1OTU0OCwiZXhwIjoyMDg1NzM1NTQ4fQ.IHp0MeBBXlvHve5Zw8B07SXmIaOwUhEk1q6_eDueuK4

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_LIFF_ID=$NEXT_PUBLIC_LIFF_ID
ENV NEXT_PUBLIC_JWT_SECRET=ttmed2548P\$u
ENV NEXT_PUBLIC_LOGIN_URL=$NEXT_PUBLIC_LOGIN_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_LIFF_URL=$NEXT_PUBLIC_LIFF_URL
ENV LINE_CHANNEL_ACCESS_TOKEN=$LINE_CHANNEL_ACCESS_TOKEN
ENV NEXT_TELEMETRY_DISABLED=1
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# สั่ง Build ตรงนี้ที่เดียวพอครับ
RUN npm run build

# 4. Runner (ตัวรันจริง)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ก๊อปปี้ไฟล์ที่จำเป็นจาก Builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# --- ต้องประกาศ ENV ซ้ำที่ Stage นี้เพื่อให้รันตัวแปรเจอตอนรันจริงครับ ---
ENV NEXT_PUBLIC_SUPABASE_URL=https://vvxsfibqlpkpzqyjwmuw.supabase.co
# ✅ แก้ ANON_KEY typo (เดิม: zqyjwmXV3 → ถูก: zqyjwmuw)
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eHNmaWJxbHBrcHpxeWp3bXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTk1NDgsImV4cCI6MjA4NTczNTU0OH0.BPbVXH2nqhhg_rMMWd6EMw4nTReKRDnDfUtPVRsw2RQ
ENV NEXT_PUBLIC_LIFF_ID=2009096451-rkWSBIMh
ENV NEXT_PUBLIC_JWT_SECRET=ttmed2548P\$u
ENV NEXT_PUBLIC_LOGIN_URL="https://psusso.ttmedpsu.org/login.php?app=internship"
ENV NEXT_PUBLIC_APP_URL=https://intern.ttmedpsu.org
ENV NEXT_PUBLIC_LIFF_URL=https://liff.line.me/2009096451-rkWSBIMh
ENV LINE_CHANNEL_ACCESS_TOKEN=HW8bjmeoi2pb8iHTV3Ua/tZTPS4ehVQntOKfNU2unJ5at9cnu50sZKfcSh9P+TT51Oa1gXZLYu41Ql/jBoq66ZIco7cGhX2ctHjbJKJiP+tSnWI+vvg15S+p2eBXspVROAGkGv9T3xDtcaROcXIMMAdB04t89/1O/w1cDnyilFU=
# ✅ เพิ่ม Service Role Key — จำเป็นสำหรับ LINE Auth Bridge (sync role metadata)
ENV SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eHNmaWJxbHBrcHpxeWp3bXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE1OTU0OCwiZXhwIjoyMDg1NzM1NTQ4fQ.IHp0MeBBXlvHve5Zw8B07SXmIaOwUhEk1q6_eDueuK4

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
