import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

// POST /api/upload — Admin only image upload to Supabase Storage
router.post('/', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { fileName, fileBase64, mimeType } = req.body;

  if (!fileName || !fileBase64 || !mimeType) {
    return res.status(400).json({ error: 'fileName, fileBase64, va mimeType kerak' });
  }

  // Decode base64 to buffer
  const buffer = Buffer.from(fileBase64, 'base64');
  const uniqueName = `${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(uniqueName, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);

  res.status(201).json({ url: urlData.publicUrl });
}));

export default router;
