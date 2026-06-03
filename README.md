# SphereChat 🌍

> AI-powered stranger chat platform. Safe, interest-based, real-time video + text.

---

## Quick Start (5 steps)

### Step 1 — Install prerequisites
- [Node.js 18+](https://nodejs.org)
- [PostgreSQL](https://postgresql.org) (or use [Railway](https://railway.app) free cloud DB)
- Redis → easiest with Docker: `docker run -d -p 6379:6379 redis:alpine`

### Step 2 — Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Open .env and fill in your keys (see below)
npx prisma generate
npx prisma db push
npm run dev
```

### Step 3 — Setup Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Open .env.local (values are pre-filled for localhost)
npm run dev
```

### Step 4 — Open the app
Go to **http://localhost:3000**

### Step 5 — Test with two users
Open http://localhost:3000 in two different browser windows (one normal, one incognito).
Sign up with two phone numbers and both click "Find a Stranger" — they will match!

---

## API Keys You Need

| Key | Where to get | Free? |
|-----|-------------|-------|
| `DATABASE_URL` | Local PostgreSQL or [railway.app](https://railway.app) | ✅ Yes |
| `REDIS_URL` | `docker run -d -p 6379:6379 redis:alpine` | ✅ Yes |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | ✅ Yes |
| `TWILIO_*` | [twilio.com](https://twilio.com) free trial | ✅ Yes (trial) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | 💳 Pay as you go |

> **Dev tip:** If you skip Twilio, OTPs print to your backend terminal. If you skip Anthropic, moderation is disabled but the app still works fully.

---

## Project Structure

```
spherechat/
├── backend/                    Node.js + Express + Socket.io
│   ├── src/
│   │   ├── index.ts            Server entry point
│   │   ├── socket/index.ts     All real-time events
│   │   ├── routes/auth.ts      Login endpoints
│   │   ├── routes/room.ts      Room endpoints
│   │   ├── middleware/auth.ts  JWT verification
│   │   └── services/
│   │       ├── otp.ts          Twilio SMS
│   │       ├── moderation.ts   Claude AI moderation
│   │       └── matching.ts     Redis matchmaking queue
│   └── prisma/schema.prisma    Database schema
│
└── frontend/                   Next.js 14 + Tailwind
    └── src/
        ├── app/
        │   ├── page.tsx        Landing page
        │   ├── login/          Phone OTP login
        │   ├── dashboard/      Mode selector
        │   └── chat/new/       Live video + chat room
        ├── components/
        │   ├── chat/           VideoPanel, ChatBox, MatchQueue
        │   └── moderation/     ModerationBadge
        └── hooks/
            ├── useSocket.ts    Socket.io events
            └── useWebRTC.ts    Peer video connection
```
