import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

// GET /api/products?category_id=
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { category_id, search } = req.query;

  let query = supabase
    .from('products')
    .select('*, categories(name, icon)')
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (category_id) {
    query = query.eq('category_id', String(category_id));
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  res.json(data);
}));

// GET /api/products/:id
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, icon)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Mahsulot topilmadi' });
  }
  res.json(data);
}));

const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  category_id: z.string().uuid().optional(),
  image_url: z.string().url().optional(),
  is_available: z.boolean().optional(),
});

// POST /api/products — Admin
router.post('/', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const parsed = ProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Noto\'g\'ri ma\'lumotlar', details: parsed.error.flatten() });
  }
  const { data, error } = await supabase.from('products').insert(parsed.data).select().single();
  if (error) throw new Error(error.message);
  res.status(201).json(data);
}));

// PATCH /api/products/:id — Admin
router.patch('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const parsed = ProductSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Noto\'g\'ri ma\'lumotlar', details: parsed.error.flatten() });
  }
  const { data, error } = await supabase
    .from('products')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Mahsulot topilmadi' });
  res.json(data);
}));

// DELETE /api/products/:id — Admin
router.delete('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('products').delete().eq('id', req.params.id);
  if (error) throw new Error(error.message);
  res.status(204).send();
}));

export default router;
