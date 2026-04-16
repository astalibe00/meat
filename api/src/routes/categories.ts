import { Router } from "express";
import { HttpError } from "../lib/errors";
import { supabasePublic } from "../lib/supabase";
import { asyncHandler } from "../middleware/error";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabasePublic
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

export default router;
