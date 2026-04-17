import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { createSupportTicket, listSupportTicketsForUser } from "../services/support";

const router = Router();

const supportCategories = [
  "general",
  "order_issue",
  "payment",
  "delivery",
  "quality",
  "wholesale",
] as const;

const SupportSchema = z.object({
  category: z.enum(supportCategories),
  details: z.string().trim().min(5),
  order_id: z.string().uuid().optional(),
});

router.use(authMiddleware);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const tickets = await listSupportTicketsForUser(req.userId!);
    res.json(tickets);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = SupportSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri support ma'lumotlari", parsed.error.flatten());
    }

    const ticket = await createSupportTicket({
      category: parsed.data.category,
      details: parsed.data.details,
      orderId: parsed.data.order_id,
      userId: req.userId!,
    });

    res.status(201).json(ticket);
  }),
);

export default router;
