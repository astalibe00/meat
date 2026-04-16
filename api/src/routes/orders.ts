import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import {
  createOrderForUser,
  getOrderForUser,
  listOrdersForUser,
  reorderOrderForUser,
} from "../services/orders";

const router = Router();

const CreateOrderSchema = z.object({
  location: z.string().trim().min(5),
  payment_method: z.enum(["cash", "click", "payme"]).default("cash"),
  phone: z.string().trim().regex(/^\+998\d{9}$/),
});

router.use(authMiddleware);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = CreateOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri ma'lumotlar", parsed.error.flatten());
    }

    const order = await createOrderForUser({
      location: parsed.data.location,
      paymentMethod: parsed.data.payment_method,
      phone: parsed.data.phone,
      userId: req.userId!,
    });

    res.status(201).json(order);
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const orders = await listOrdersForUser(req.userId!);
    res.json(orders);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await getOrderForUser(req.userId!, req.params.id);
    res.json(order);
  }),
);

router.post(
  "/:id/reorder",
  asyncHandler(async (req, res) => {
    const order = await reorderOrderForUser(req.userId!, req.params.id);
    res.json({
      message: "Buyurtma savatchaga qayta qo'shildi",
      order_id: order.id,
    });
  }),
);

export default router;
