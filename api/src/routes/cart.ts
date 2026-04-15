import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

// GET /api/cart
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('carts')
    .select('*, products(id, name, price, image_url)')
    .eq('user_id', req.userId!);

  if (error) throw new Error(error.message);
  res.json(data);
}));

const AddCartSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

// POST /api/cart
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const parsed = AddCartSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Noto\'g\'ri ma\'lumotlar', details: parsed.error.flatten() });
  }

  const { product_id, quantity } = parsed.data;

  // Upsert: if exists, increment quantity
  const { data: existing } = await supabase
    .from('carts')
    .select('id, quantity')
    .eq('user_id', req.userId!)
    .eq('product_id', product_id)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('carts')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return res.json(data);
  }

  const { data, error } = await supabase
    .from('carts')
    .insert({ user_id: req.userId!, product_id, quantity })
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.status(201).json(data);
}));

// PATCH /api/cart/:product_id
router.patch('/:product_id', authMiddleware, asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (typeof quantity !== 'number' || quantity < 1) {
    return res.status(400).json({ error: 'Miqdor 1 dan katta bo\'lishi kerak' });
  }

  const { data, error } = await supabase
    .from('carts')
    .update({ quantity })
    .eq('user_id', req.userId!)
    .eq('product_id', req.params.product_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Savat elementi topilmadi' });
  res.json(data);
}));

// DELETE /api/cart/:product_id
router.delete('/:product_id', authMiddleware, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('carts')
    .delete()
    .eq('user_id', req.userId!)
    .eq('product_id', req.params.product_id);

  if (error) throw new Error(error.message);
  res.status(204).send();
}));

// DELETE /api/cart — clear entire cart
router.delete('/', authMiddleware, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('carts').delete().eq('user_id', req.userId!);
  if (error) throw new Error(error.message);
  res.status(204).send();
}));

export default router;
