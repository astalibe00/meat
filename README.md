# Fresh Halal Direct

Fresh Halal Direct is a Vite storefront with a Vercel-ready Telegram bot webhook.

## What is included

- Mobile-first halal meat storefront
- Cart, promo, checkout, orders, and support flows
- Telegram bot webhook with minimal menus for shop, deals, delivery, and support
- Vercel production configuration for the site and serverless bot endpoints

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm test
npm run build
```

## Telegram bot environment variables

Add these in Vercel before syncing the bot:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_WEBAPP_URL`

`TELEGRAM_WEBAPP_URL` should point to the deployed storefront URL.

## Telegram bot endpoints

- `GET /api/telegram-webhook` - health check
- `POST /api/telegram-webhook` - Telegram webhook target
- `GET /api/telegram-sync` - registers webhook, commands, and chat menu button

After deployment, call `/api/telegram-sync` once to register the bot with Telegram.
