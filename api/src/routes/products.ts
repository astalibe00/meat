import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors";
import { publishProductToChannel } from "../lib/telegram-bot";
import { supabase, supabasePublic } from "../lib/supabase";
import { adminMiddleware, authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

const ProductSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  is_available: z.boolean().optional(),
  name: z.string().trim().min(1),
  price: z.coerce.number().positive(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const categoryId = req.query.category_id?.toString();
    const search = req.query.search?.toString().trim();

    let query = supabasePublic
      .from("products")
      .select("*, categories(id, name, icon, sort_order)")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(500, "Mahsulotlarni yuklashda xatolik");
    }

    res.json(data ?? []);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { data, error } = await supabasePublic
      .from("products")
      .select("*, categories(id, name, icon, sort_order)")
      .eq("id", req.params.id)
      .single();

    if (error || !data) {
      throw new HttpError(404, "Mahsulot topilmadi");
    }

    res.json(data);
  }),
);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = ProductSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri ma'lumotlar", parsed.error.flatten());
    }

    const { data, error } = await supabase
      .from("products")
      .insert(parsed.data)
      .select("*, categories(id, name, icon, sort_order)")
      .single();

    if (error || !data) {
      throw new HttpError(500, "Mahsulot yaratishda xatolik");
    }

    publishProductToChannel(data).catch((channelError) => {
      console.error("Channel publish failed:", channelError);
    });

    res.status(201).json(data);
  }),
);

router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = ProductSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri ma'lumotlar", parsed.error.flatten());
    }

    const { data, error } = await supabase
      .from("products")
      .update(parsed.data)
      .eq("id", req.params.id)
      .select("*, categories(id, name, icon, sort_order)")
      .single();

    if (error || !data) {
      throw new HttpError(404, "Mahsulot topilmadi");
    }

    res.json(data);
  }),
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      throw new HttpError(500, "Mahsulotni o'chirishda xatolik");
    }

    res.status(204).send();
  }),
);

export default router;
