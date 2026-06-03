# SphereChat — Setup Guide

## ✅ Step 1 — Prerequisites

Install these before anything else:

| Tool | Link | Check |
|------|------|-------|
| Node.js 18+ | https://nodejs.org | `node --version` |
| PostgreSQL | https://postgresql.org | `psql --version` |
| Redis | Docker: `docker run -d -p 6379:6379 redis:alpine` | `redis-cli ping` |

---

## ✅ Step 2 — Open in VS Code

```
File → Open Folder → select the spherechat folder
```

Open the integrated terminal: `Ctrl + `` ` ` ``

---

## ✅ Step 3 — Configure Backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:

### DATABASE_URL
Local PostgreSQL:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/spherechat"
```
Free cloud DB at [railway.app](https://railway.app):
```
DATABASE_URL="postgresql://postgres:xxx@containers-xxx.railway.app:5432/railway"
```

### JWT_SECRET
Run this in terminal and paste the output:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Twilio (optional for dev)
Get free trial at [twilio.com](https://twilio.com)
> **If you skip this**, OTP codes will print directly in your terminal instead of SMS — works fine for testing!

### Anthropic (optional for dev)
Get key at [console.anthropic.com](https://console.anthropic.com)
> **If you skip this**, AI moderation is disabled but the app works fully.

---

## ✅ Step 4 — Install & Setup Database

```bash
# In VS Code terminal:
cd backend
npm install
npx prisma generate
npx prisma db push
```

Expected output: `✅ Your database is now in sync`

---

## ✅ Step 5 — Install Frontend

Open a second terminal tab (`+` button in VS Code terminal):

```bash
cd frontend
npm install
```

---

## ✅ Step 6 — Run Both Servers

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
You should see:
```
🌐  SphereChat Backend — port 4000
⚡  Socket.io ready
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
You should see:
```
▲ Next.js 14
- Local: http://localhost:3000
```

---

## ✅ Step 7 — Test It

1. Go to **http://localhost:3000**
2. Click **Get Started**
3. Enter phone number (e.g. `+919876543210`)
4. The OTP will appear in your **backend terminal** (dev mode)
5. Create a username and pick interests
6. Click **Find a Stranger**
7. Open a **second browser window** (or incognito tab)
8. Sign up with a different phone number
9. Both click **Find a Stranger** — they will match!

---

## 🐛 Troubleshooting

**"Cannot connect to database"**
```bash
# Make sure PostgreSQL is running:
# Windows: Start PostgreSQL from Services
# Mac: brew services start postgresql
# Linux: sudo service postgresql start
```

**"Redis connection refused"**
```bash
docker run -d -p 6379:6379 redis:alpine
```

**"Camera not working"**
- Browser needs HTTPS for camera in production
- On localhost it works without HTTPS — just allow camera when browser asks

**"OTP not received"**
- Check backend terminal — OTP prints there in dev mode
- Make sure phone number includes country code: `+91XXXXXXXXXX`

**"Video not connecting"**
- Make sure both browser windows are on the same network
- For production across different networks, you need a TURN server

---

## 📁 What Each File Does

```
backend/
  src/index.ts              → Starts Express server + Socket.io
  src/socket/index.ts       → ALL real-time events (match, chat, WebRTC)
  src/services/otp.ts       → Sends/verifies SMS codes via Twilio
  src/services/moderation.ts→ Claude AI moderates every message
  src/services/matching.ts  → Redis queue for interest-based matching
  src/routes/auth.ts        → Login endpoints (/send-otp, /verify-otp)
  src/routes/room.ts        → Room endpoints (rate, save-friend)
  src/middleware/auth.ts    → JWT verification for protected routes
  prisma/schema.prisma      → Database tables (User, Room, Message, etc)

frontend/
  src/app/page.tsx          → Landing page
  src/app/login/page.tsx    → Phone OTP login (3 steps)
  src/app/dashboard/page.tsx→ Mode selector + Find Stranger button
  src/app/chat/new/page.tsx → MAIN: live video + chat room
  src/hooks/useSocket.ts    → All Socket.io events in one hook
  src/hooks/useWebRTC.ts    → WebRTC peer video connection
  src/components/chat/
    VideoPanel.tsx          → Shows local + remote video
    ChatBox.tsx             → Message list + input + typing indicator
    MatchQueue.tsx          → "Finding stranger..." animated screen
  src/lib/socket.ts         → Socket.io client singleton
  src/types/index.ts        → TypeScript types
```
