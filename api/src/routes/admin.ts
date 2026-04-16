import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors";
import { publishProductToChannel } from "../lib/telegram-bot";
import { supabase } from "../lib/supabase";
import { adminMiddleware, authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import {
  getDashboardSummary,
  getAnalytics,
  listAdminOrders,
  ORDER_STATUSES,
  updateOrderStatus,
} from "../services/orders";

const router = Router();

const StatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

const CategorySchema = z.object({
  icon: z.string().trim().max(32).nullable().optional(),
  name: z.string().trim().min(1),
  sort_order: z.coerce.number().int().min(0).default(0),
});

const ProductSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  is_available: z.boolean().optional(),
  name: z.string().trim().min(1),
  price: z.coerce.number().positive(),
});

router.use(authMiddleware, adminMiddleware);

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const dashboard = await getDashboardSummary();
    res.json(dashboard);
  }),
);

router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const rawStatuses = req.query.status?.toString();
    const statuses = rawStatuses
      ? rawStatuses
          .split(",")
          .map((item) => item.trim())
          .filter((item): item is (typeof ORDER_STATUSES)[number] =>
            ORDER_STATUSES.includes(item as (typeof ORDER_STATUSES)[number]),
          )
      : undefined;
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit.toString(), 10)
      : 50;

    const orders = await listAdminOrders(
      Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 50,
      statuses,
    );

    res.json(orders);
  }),
);

router.patch(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const parsed = StatusSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri status", parsed.error.flatten());
    }

    const order = await updateOrderStatus(req.params.id, parsed.data.status);
    res.json(order);
  }),
);

router.get(
  "/analytics",
  asyncHandler(async (_req, res) => {
    const topProducts = await getAnalytics();
    res.json({ topProducts });
  }),
);

router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new HttpError(500, "Kategoriyalarni yuklashda xatolik");
    }

    res.json(data ?? []);
  }),
);

router.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const parsed = CategorySchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri kategoriya ma'lumotlari", parsed.error.flatten());
    }

    const { data, error } = await supabase
      .from("categories")
      .insert(parsed.data)
      .select("*")
      .single();

    if (error || !data) {
      throw new HttpError(500, "Kategoriya yaratishda xatolik");
    }

    res.status(201).json(data);
  }),
);

router.patch(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const parsed = CategorySchema.partial().safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri kategoriya ma'lumotlari", parsed.error.flatten());
    }

    const { data, error } = await supabase
      .from("categories")
      .update(parsed.data)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new HttpError(404, "Kategoriya topilmadi");
    }

    res.json(data);
  }),
);

router.delete(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      throw new HttpError(500, "Kategoriyani o'chirishda xatolik");
    }

    res.status(204).send();
  }),
);

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const categoryId = req.query.category_id?.toString();
    const search = req.query.search?.toString().trim();

    let query = supabase
      .from("products")
      .select("*, categories(id, name, icon, sort_order)")
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

router.post(
  "/products",
  asyncHandler(async (req, res) => {
    const parsed = ProductSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri mahsulot ma'lumotlari", parsed.error.flatten());
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

router.get(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
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

router.patch(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const parsed = ProductSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri mahsulot ma'lumotlari", parsed.error.flatten());
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
  "/products/:id",
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
