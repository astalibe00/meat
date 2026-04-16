import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import {
  getUserProfileById,
  isUserRegistered,
  serializeUserProfile,
  updateUserProfile,
} from "../services/users";

const router = Router();

const UpdateProfileSchema = z.object({
  default_address: z.string().trim().min(5).optional(),
  first_name: z.string().trim().min(1).optional(),
  phone: z.string().trim().regex(/^\+998\d{9}$/).optional(),
});

router.use(authMiddleware);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const profile = await getUserProfileById(req.userId!);

    res.json(
      serializeUserProfile(profile, {
        isAdmin: Boolean(req.isAdmin),
        isRegistered: isUserRegistered(profile),
      }),
    );
  }),
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = UpdateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Noto'g'ri profil ma'lumotlari", parsed.error.flatten());
    }

    const profile = await updateUserProfile(req.userId!, parsed.data);

    res.json(
      serializeUserProfile(profile, {
        isAdmin: Boolean(req.isAdmin),
        isRegistered: isUserRegistered(profile),
      }),
    );
  }),
);

export default router;
