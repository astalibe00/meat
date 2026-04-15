import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

// GET /api/categories
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  res.json(data);
}));

// POST /api/categories — Admin only
const CategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  sort_order: z.number().optional(),
});

router.post('/', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const parsed = CategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Noto\'g\'ri ma\'lumotlar', details: parsed.error.flatten() });
  }
  const { data, error } = await supabase.from('categories').insert(parsed.data).select().single();
  if (error) throw new Error(error.message);
  res.status(201).json(data);
}));

export default router;
