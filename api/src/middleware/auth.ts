import { Request, Response, NextFunction } from 'express';
import { validateTelegramData, TelegramUser } from '../lib/telegram';
import { supabase } from '../lib/supabase';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      telegramUser?: TelegramUser;
      userId?: string;
      isAdmin?: boolean;
    }
  }
}

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map((id) => parseInt(id.trim(), 10));

/**
 * Authentication middleware — validates Telegram WebApp initData HMAC
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('TelegramWebApp ')) {
      return res.status(401).json({ error: 'Avtorizatsiya kerak' });
    }

    const initData = authHeader.replace('TelegramWebApp ', '');
    const { valid, user } = validateTelegramData(initData, BOT_TOKEN);

    if (!valid || !user) {
      return res.status(401).json({ error: 'Yaroqsiz avtorizatsiya ma\'lumotlari' });
    }

    // Upsert user in database
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          telegram_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name || null,
          username: user.username || null,
        },
        { onConflict: 'telegram_id' }
      )
      .select('id')
      .single();

    if (error || !data) {
      console.error('User upsert error:', error);
      return res.status(500).json({ error: 'Foydalanuvchi ma\'lumotlarini saqlashda xatolik' });
    }

    req.telegramUser = user;
    req.userId = data.id;
    req.isAdmin = ADMIN_IDS.includes(user.id);

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Server xatoligi' });
  }
}

/**
 * Admin-only middleware — must be used AFTER authMiddleware
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: '⛔ Ruxsat yo\'q' });
  }
  next();
}
