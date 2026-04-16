import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import { adminMiddleware, authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

const UploadSchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
});

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = UploadSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri yuklash ma'lumotlari", parsed.error.flatten());
    }

    const base64 = parsed.data.fileBase64.includes(",")
      ? parsed.data.fileBase64.split(",").pop() ?? ""
      : parsed.data.fileBase64;
    const safeFileName = parsed.data.fileName.replace(/\s+/g, "-");
    const storagePath = `products/${Date.now()}-${safeFileName}`;

    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(storagePath, Buffer.from(base64, "base64"), {
        contentType: parsed.data.mimeType,
        upsert: false,
      });

    if (error || !data) {
      throw new HttpError(500, "Rasmni yuklashda xatolik");
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(data.path);

    res.status(201).json({ url: publicUrlData.publicUrl });
  }),
);

export default router;
