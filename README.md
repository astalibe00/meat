# Telegram Marketplace

Telegram marketplace monorepo with three workspaces:

- `api` - Express API for catalog, cart, orders, admin routes, and uploads
- `bot` - grammY bot with webhook mode for Vercel and polling mode for local development
- `frontend` - Telegram Mini App built with React, Vite, Tailwind, React Query, and Supabase Realtime fallback polling

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in Telegram and Supabase variables.
3. For local Mini App testing outside Telegram, set `DEV_TELEGRAM_ID` to a Telegram user id that should act as the current user.
4. Install dependencies from the repo root:

```bash
npm install
```

## Local Development

Run each workspace in a separate terminal from the repo root:

```bash
npm run dev --workspace api
npm run dev --workspace bot
npm run dev --workspace frontend
```

Local frontend requests use `/api` and are proxied to `http://localhost:3001` by Vite. Protected routes use Telegram Web App `initData` automatically, or `DEV_TELEGRAM_ID` when testing outside Telegram.

## Build

```bash
npm run build
```

## Deploy

- Frontend is served as a Vercel static build.
- API and bot are deployed as Vercel Node functions.
- Bot webhook endpoint is `POST /bot/webhook`.
