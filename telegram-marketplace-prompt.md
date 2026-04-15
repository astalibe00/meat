# Telegram Marketplace System — Full Prompt

Create a full-featured Telegram marketplace system consisting of a Telegram Bot and a Telegram Mini App (Web App), inspired by modern food delivery platforms like Yandex Eats.

---

## CRITICAL REQUIREMENTS

- The entire user interface (UI text, buttons, labels, messages) MUST be in **Uzbek language (Latin script)**.
- The code, structure, comments, and logic must be written in **English**.
- The system must be **production-ready, scalable, and modular**.
- Deploy target: **Vercel** (all services as serverless functions or static builds).
- Database: **Supabase (PostgreSQL)** with Supabase JS client.
- Authentication: **Telegram WebApp `initData` HMAC validation** on every protected API request.

---

## TECHNICAL STACK (FIXED — DO NOT DEVIATE)

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Bot         | Node.js + **grammY**                    |
| Frontend    | **React 18** + Vite + TailwindCSS       |
| Backend     | Node.js + **Express** (Vercel serverless)|
| Database    | **Supabase** (PostgreSQL via supabase-js)|
| Real-time   | **Supabase Realtime** (WebSocket)       |
| Image Storage | **Supabase Storage**                  |
| Validation  | **Zod**                                 |
| ORM         | Supabase JS client (no extra ORM)       |
| Deploy      | **Vercel** (monorepo)                   |

---

## MONOREPO FOLDER STRUCTURE

```
/
├── bot/                    # grammY Telegram bot
│   ├── src/
│   │   ├── commands/       # /start, /orders, /accept, /deliver
│   │   ├── notifications/  # order status notifiers
│   │   └── index.ts
│   └── package.json
│
├── api/                    # Express backend (Vercel serverless)
│   ├── src/
│   │   ├── routes/         # products, orders, cart, users
│   │   ├── controllers/
│   │   ├── middleware/     # auth, validation, error handler
│   │   ├── lib/            # supabase client, telegram HMAC
│   │   └── index.ts
│   └── package.json
│
├── frontend/               # React Mini App
│   ├── src/
│   │   ├── pages/          # Home, ProductList, ProductDetail,
│   │   │                   # Cart, Checkout, OrderTracking
│   │   ├── components/     # Shared UI components
│   │   ├── store/          # Zustand global state
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # supabase client, api client
│   │   └── main.tsx
│   └── package.json
│
├── vercel.json             # Routing config for monorepo
└── .env.example
```

---

## ENVIRONMENT VARIABLES

Create `.env.example` with all required variables:

```env
# Telegram
BOT_TOKEN=
WEBHOOK_URL=
CHANNEL_ID=
ADMIN_TELEGRAM_IDS=     # comma-separated list of admin IDs
MINI_APP_URL=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NODE_ENV=production
JWT_SECRET=
```

---

## DATABASE SCHEMA (Supabase / PostgreSQL)

Create these tables in Supabase with Row Level Security (RLS) enabled.

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  username TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0
);
```

### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### carts
```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  UNIQUE(user_id, product_id)
);
```

### orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  items JSONB NOT NULL,           -- [{product_id, name, price, quantity}]
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','preparing','delivering','completed','cancelled')),
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Enable Supabase Realtime on the `orders` table for live order tracking.

---

## AUTHENTICATION — CRITICAL

Every API request from the Mini App must include `initData` from `window.Telegram.WebApp.initData` in the Authorization header:

```
Authorization: TelegramWebApp <initData>
```

Backend middleware must:
1. Parse the `initData` string.
2. Validate the HMAC-SHA256 signature using `BOT_TOKEN`.
3. Check that `auth_date` is not older than 1 hour.
4. Extract `user.id` and look up or create the user in Supabase.
5. Reject any request with an invalid or missing signature with HTTP 401.

Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

---

## BACKEND API (Express — Vercel Serverless)

### Products
```
GET    /api/products              # list all (filter: ?category_id=)
GET    /api/products/:id          # single product detail
POST   /api/products              # [ADMIN] create product
PATCH  /api/products/:id          # [ADMIN] update product
DELETE /api/products/:id          # [ADMIN] delete product
```

### Categories
```
GET    /api/categories            # list all categories
```

### Cart
```
GET    /api/cart                  # get current user's cart
POST   /api/cart                  # add item {product_id, quantity}
PATCH  /api/cart/:product_id      # update quantity
DELETE /api/cart/:product_id      # remove item
DELETE /api/cart                  # clear entire cart
```

### Orders
```
POST   /api/orders                # place order (clears cart after)
GET    /api/orders                # get current user's orders
GET    /api/orders/:id            # single order detail
GET    /api/admin/orders          # [ADMIN] all orders
PATCH  /api/orders/:id/status     # [ADMIN] update order status
```

### Image Upload
```
POST   /api/upload                # [ADMIN] upload image to Supabase Storage
```

All endpoints must:
- Use Zod schemas for request body validation.
- Return consistent error format: `{ error: string, details?: any }`.
- Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 500).

---

## FRONTEND (React Mini App)

### Setup
- Use `@twa-dev/sdk` for Telegram WebApp SDK integration.
- Use **Zustand** for global state (cart, user).
- Use **React Query (TanStack Query)** for server state and caching.
- Use **React Router v6** for page navigation.
- Use **Framer Motion** for animations.
- Use TailwindCSS for styling.

### Pages

#### 1. Home Page (`/`)
- Header: location display ("Toshkent"), notification icon.
- Search bar — filters products in real-time.
- Promotional banner (carousel, auto-scroll).
- Horizontal scrollable category list with icons.
- Product grid (2 columns) with product cards.
- Sticky bottom navigation bar.

#### 2. Product List Page (`/products`)
- Filter bar: category chips.
- Sort options: "Narxi: arzondan", "Narxi: qimmatdan", "Mashhur".
- Product cards:
  - Image
  - Name
  - Price (formatted as "25 000 so'm")
  - "Savatga qo'shish" button

#### 3. Product Detail Page (`/products/:id`)
- Full-width image.
- Product name, price, description.
- Quantity selector (+/-).
- Sticky bottom bar with "Savatga qo'shish" button and total price.

#### 4. Cart Page (`/cart`)
- List of items with image, name, price, quantity controls.
- Remove button per item.
- Total price summary.
- "Buyurtma berish" button (navigates to Checkout).
- Empty cart state with illustration.

#### 5. Checkout Page (`/checkout`)
- Phone number input (Uzbekistan format: +998XXXXXXXXX).
- Delivery address input (text).
- Payment method selector (only "Naqd pul" for now, designed to support more later).
- Order summary (collapsed, expandable).
- "Tasdiqlash" confirm button.
- On success: redirect to Order Tracking page.

#### 6. Order Tracking Page (`/orders/:id`)
- Timeline UI with 5 steps:
  1. Qabul qilindi
  2. Tasdiqlandi
  3. Tayyorlanmoqda
  4. Yetkazilmoqda
  5. Yetkazildi
- Current step highlighted, previous steps marked complete.
- Order details summary (items, total, address).
- **Real-time updates via Supabase Realtime** — no page refresh required.

### UI/UX Design Requirements
- Color palette:
  - Primary: `#C0392B` (deep red)
  - Primary dark: `#96281B`
  - Background: `#F5F5F0`
  - Surface: `#FFFFFF`
  - Text primary: `#1A1A1A`
  - Text secondary: `#6B6B6B`
- Telegram WebApp native theming: use `window.Telegram.WebApp.themeParams` to adapt to user's Telegram theme.
- Mobile-first — designed for 375px width minimum.
- Smooth page transitions with Framer Motion.
- Skeleton loading states for all data-fetching components.
- All currency formatted as Uzbek sum: "25 000 so'm".
- Pull-to-refresh on product list and orders.

### Bottom Navigation (persistent)
- Asosiy (Home) — house icon
- Mahsulotlar (Products) — grid icon
- Savatcha (Cart) — cart icon with badge count
- Buyurtmalar (Orders) — receipt icon

---

## TELEGRAM BOT (grammY)

### Commands

#### /start
- Greet the user by first name.
- Show inline keyboard button: `🛒 Do'konni ochish` (opens Mini App via WebApp URL).

#### /orders — Admin only
- List last 10 pending/accepted orders.
- Each order shows: ID (short), user name, total, status.
- Inline buttons: "✅ Qabul qilish" and "🚀 Yetkazishga yuborish".

#### /accept <order_id> — Admin only
- Sets order status to `accepted`.
- Sends notification to the customer.

#### /deliver <order_id> — Admin only
- Sets order status to `delivering`.
- Sends notification to the customer.

#### /cancel <order_id> — Admin only
- Sets order status to `cancelled`.
- Sends notification to the customer.

### Notifications

**New order → Admin notification:**
```
🆕 Yangi buyurtma!

👤 Mijoz: {name}
📦 Mahsulotlar: {items list}
💰 Jami: {total} so'm
📍 Manzil: {location}
📞 Tel: {phone}

Buyurtma ID: #{short_id}
```

**Status update → Customer notification:**
```
✅ Buyurtmangiz tasdiqlandi!
— yoki —
👨‍🍳 Buyurtmangiz tayyorlanmoqda!
— yoki —
🚗 Buyurtmangiz yetkazilmoqda!
— yoki —
🎉 Buyurtmangiz yetkazildi!

Buyurtma: #{short_id}
```

### Admin Access Control
- Check `telegram_id` against `ADMIN_TELEGRAM_IDS` env variable for all admin commands.
- Respond with "⛔ Ruxsat yo'q" to unauthorized users.

### Channel Integration
When a new product is published (admin triggers):
- Post to `CHANNEL_ID` with:
  - Product image.
  - Name and price.
  - Description (first 100 chars).
  - Inline button: "🛒 Buyurtma berish" (deep link to Mini App with product ID).

Deep link format: `https://t.me/{BOT_USERNAME}/app?startapp=product_{product_id}`

---

## ORDER FLOW (COMPLETE)

```
User places order
       ↓
Order created (status: pending)
Cart cleared in Supabase
       ↓
Admin receives Telegram notification
       ↓
Admin accepts (/accept or inline button)
Status → accepted
Customer notified
       ↓
Admin sets preparing (via bot)
Status → preparing
Customer notified
       ↓
Admin sets delivering (/deliver or inline button)
Status → delivering
Customer notified
       ↓
Admin sets completed
Status → completed
Customer notified 🎉
```

Each status change must:
1. Update `orders.status` in Supabase.
2. Update `orders.updated_at`.
3. Send Telegram notification to the customer via bot.
4. Broadcast via Supabase Realtime so the Mini App order tracking page updates in real-time without refresh.

---

## VERCEL DEPLOYMENT CONFIG

`vercel.json`:
```json
{
  "version": 2,
  "builds": [
    { "src": "api/src/index.ts", "use": "@vercel/node" },
    { "src": "frontend/package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
    { "src": "bot/src/index.ts", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "api/src/index.ts" },
    { "src": "/bot/(.*)", "dest": "bot/src/index.ts" },
    { "src": "/(.*)", "dest": "frontend/dist/$1" }
  ]
}
```

- Bot must use **webhook mode** (not polling) for Vercel serverless compatibility.
- Webhook URL: `POST /bot/webhook`.
- Register webhook on first deploy using `setWebhook`.

---

## ERROR HANDLING STANDARDS

- All Express routes wrapped in `asyncHandler` to catch unhandled promise rejections.
- Global error middleware returns consistent JSON error responses.
- Frontend: React Error Boundaries per page.
- Zod validation errors must be formatted into user-readable messages.
- All Supabase errors must be caught and logged — never expose raw Supabase error messages to the client.

---

## ADVANCED FEATURES (OPTIONAL BUT PREFERRED)

1. **Deep linking**: Opening `t.me/{bot}?startapp=product_{id}` in Telegram must open the Mini App directly on that product's detail page.
2. **Analytics endpoint**: `GET /api/admin/analytics` — returns top 5 products by order count and total revenue for the last 30 days.
3. **Search**: Full-text product search using Supabase `ilike` on `name` and `description`.
4. **Delivery ETA**: Show estimated delivery time ("~30 daqiqa") on Order Tracking page.
5. **Click/Payme payment stub**: Add payment method slots in the UI, marked as "Tez orada" (coming soon), so the architecture supports them later.

---

## FINAL DELIVERABLE CHECKLIST

- [ ] Monorepo with `/bot`, `/api`, `/frontend` folders.
- [ ] `.env.example` with all required variables.
- [ ] Supabase SQL migration file for all tables.
- [ ] Telegram WebApp HMAC auth middleware.
- [ ] All 6 Mini App pages implemented.
- [ ] grammY bot with all commands and notifications.
- [ ] Supabase Realtime integration on Order Tracking page.
- [ ] Vercel deployment config (`vercel.json`).
- [ ] Uzbek language throughout all UI.
- [ ] Consistent error handling on both frontend and backend.
- [ ] README with setup and deploy instructions.
