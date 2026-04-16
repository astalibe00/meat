import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const router = Router();

const AddCartItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive().default(1),
});

const UpdateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

router.use(authMiddleware);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("carts")
      .select("id, product_id, quantity, products(id, name, price, image_url, is_available)")
      .eq("user_id", req.userId!);

    if (error) {
      throw new HttpError(500, "Savatchani yuklashda xatolik");
    }

    res.json(data ?? []);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = AddCartItemSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri ma'lumotlar", parsed.error.flatten());
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, is_available")
      .eq("id", parsed.data.product_id)
      .single();

    if (productError || !product || !product.is_available) {
      throw new HttpError(400, "Mahsulot savatga qo'shib bo'lmaydi");
    }

    const { data: existingItem } = await supabase
      .from("carts")
      .select("id, quantity")
      .eq("user_id", req.userId!)
      .eq("product_id", parsed.data.product_id)
      .single();

    const quantity = existingItem
      ? existingItem.quantity + parsed.data.quantity
      : parsed.data.quantity;

    const { error } = existingItem
      ? await supabase
          .from("carts")
          .update({ quantity })
          .eq("id", existingItem.id)
      : await supabase.from("carts").insert({
          product_id: parsed.data.product_id,
          quantity,
          user_id: req.userId!,
        });

    if (error) {
      throw new HttpError(500, "Savatchani yangilashda xatolik");
    }

    const { data: cartItem, error: cartError } = await supabase
      .from("carts")
      .select("id, product_id, quantity, products(id, name, price, image_url, is_available)")
      .eq("user_id", req.userId!)
      .eq("product_id", parsed.data.product_id)
      .single();

    if (cartError || !cartItem) {
      throw new HttpError(500, "Savatcha elementini yuklashda xatolik");
    }

    res.status(existingItem ? 200 : 201).json(cartItem);
  }),
);

router.patch(
  "/:productId",
  asyncHandler(async (req, res) => {
    const parsed = UpdateCartItemSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri ma'lumotlar", parsed.error.flatten());
    }

    const { data, error } = await supabase
      .from("carts")
      .update({ quantity: parsed.data.quantity })
      .eq("user_id", req.userId!)
      .eq("product_id", req.params.productId)
      .select("id, product_id, quantity, products(id, name, price, image_url, is_available)")
      .single();

    if (error || !data) {
      throw new HttpError(404, "Savatcha elementi topilmadi");
    }

    res.json(data);
  }),
);

router.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    const { error } = await supabase
      .from("carts")
      .delete()
      .eq("user_id", req.userId!)
      .eq("product_id", req.params.productId);

    if (error) {
      throw new HttpError(500, "Savatcha elementini o'chirishda xatolik");
    }

    res.status(204).send();
  }),
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { error } = await supabase
      .from("carts")
      .delete()
      .eq("user_id", req.userId!);

    if (error) {
      throw new HttpError(500, "Savatchani tozalashda xatolik");
    }

    res.status(204).send();
  }),
);

export default router;
