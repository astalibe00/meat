import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

const OrderSchema = z.object({
  phone: z.string().min(9).max(20),
  location: z.string().min(5),
  payment_method: z.enum(['cash', 'click', 'payme']).default('cash'),
});

// POST /api/orders — Place order
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const parsed = OrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Noto\'g\'ri ma\'lumotlar', details: parsed.error.flatten() });
  }

  // Fetch user's cart with product details
  const { data: cartItems, error: cartError } = await supabase
    .from('carts')
    .select('quantity, products(id, name, price, is_available)')
    .eq('user_id', req.userId!);

  if (cartError) throw new Error(cartError.message);
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: 'Savatcha bo\'sh' });
  }

  // Build order items and total
  const items = cartItems.map((ci: any) => ({
    product_id: ci.products.id,
    name: ci.products.name,
    price: ci.products.price,
    quantity: ci.quantity,
  }));

  const total_price = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: req.userId!,
      items,
      total_price,
      phone: parsed.data.phone,
      location: parsed.data.location,
      payment_method: parsed.data.payment_method,
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  // Clear cart after order placed
  await supabase.from('carts').delete().eq('user_id', req.userId!);

  // Notify admin via Telegram bot (fire and forget)
  notifyAdmin(order).catch(console.error);

  res.status(201).json(order);
}));

// GET /api/orders — Current user's orders
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', req.userId!)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  res.json(data);
}));

// GET /api/orders/:id — Order detail
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  res.json(data);
}));

// GET /api/admin/orders — All orders (Admin)
router.get('/admin/all', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, users(first_name, last_name, username, telegram_id)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  res.json(data);
}));

const StatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'preparing', 'delivering', 'completed', 'cancelled']),
});

// PATCH /api/orders/:id/status — Update status (Admin)
router.patch('/:id/status', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Noto\'g\'ri status', details: parsed.error.flatten() });
  }

  const { data: order, error } = await supabase
    .from('orders')
    .update({ status: parsed.data.status })
    .eq('id', req.params.id)
    .select('*, users(telegram_id, first_name)')
    .single();

  if (error || !order) return res.status(404).json({ error: 'Buyurtma topilmadi' });

  // Notify customer about status change
  notifyCustomer(order, parsed.data.status).catch(console.error);

  res.json(order);
}));

// GET /api/admin/analytics — Top 5 products (Admin)
router.get('/admin/analytics', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('orders')
    .select('items, total_price, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .neq('status', 'cancelled');

  if (error) throw new Error(error.message);

  // Compute product stats
  const productStats: Record<string, { name: string; count: number; revenue: number }> = {};

  for (const order of data || []) {
    for (const item of (order.items as any[])) {
      if (!productStats[item.product_id]) {
        productStats[item.product_id] = { name: item.name, count: 0, revenue: 0 };
      }
      productStats[item.product_id].count += item.quantity;
      productStats[item.product_id].revenue += item.price * item.quantity;
    }
  }

  const topProducts = Object.entries(productStats)
    .map(([product_id, stats]) => ({ product_id, ...stats }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({ topProducts });
}));

// --- Helpers ---

async function notifyAdmin(order: any) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').filter(Boolean);
  if (!BOT_TOKEN || ADMIN_IDS.length === 0) return;

  const shortId = order.id.slice(0, 6).toUpperCase();
  const itemsList = (order.items as any[])
    .map((i: any) => `• ${i.name} ×${i.quantity} — ${i.price * i.quantity} so'm`)
    .join('\n');

  const text = `🆕 Yangi buyurtma!\n\n📦 Mahsulotlar:\n${itemsList}\n\n💰 Jami: ${order.total_price} so'm\n📍 Manzil: ${order.location}\n📞 Tel: ${order.phone}\n\nBuyurtma ID: #${shortId}`;

  for (const adminId of ADMIN_IDS) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminId.trim(),
        text,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Qabul qilish', callback_data: `accept:${order.id}` },
              { text: '❌ Bekor qilish', callback_data: `cancel:${order.id}` },
            ],
          ],
        },
      }),
    });
  }
}

async function notifyCustomer(order: any, status: string) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN || !order.users?.telegram_id) return;

  const shortId = order.id.slice(0, 6).toUpperCase();
  const messages: Record<string, string> = {
    accepted: `✅ Buyurtmangiz tasdiqlandi!\n\nBuyurtma: #${shortId}`,
    preparing: `👨‍🍳 Buyurtmangiz tayyorlanmoqda!\n\nBuyurtma: #${shortId}`,
    delivering: `🚗 Buyurtmangiz yetkazilmoqda!\n\nBuyurtma: #${shortId}`,
    completed: `🎉 Buyurtmangiz yetkazildi!\n\nRahmat! Buyurtma: #${shortId}`,
    cancelled: `❌ Buyurtmangiz bekor qilindi.\n\nBuyurtma: #${shortId}`,
  };

  const text = messages[status];
  if (!text) return;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: order.users.telegram_id,
      text,
    }),
  });
}

export default router;
