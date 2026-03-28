import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import { serviceClient } from "../config/supabase";

const router = Router();

const updateProfileSchema = z.object({
  display_name: z.string().min(1).optional(),
  avatar_url: z.string().url().optional(),
  onboarding_completed: z.boolean().optional(),
});

// GET /profile
router.get("/profile", async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("profiles")
    .select("*")
    .eq("id", req.userId)
    .single();

  if (error) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(data);
});

// PATCH /profile
router.patch("/profile", validateBody(updateProfileSchema), async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("profiles")
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq("id", req.userId)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// DELETE /account
router.delete("/account", async (req: Request, res: Response): Promise<void> => {
  // Delete all user data in order (cascades handle most of it)
  await req.supabase.from("bookmarks").delete().eq("user_id", req.userId);
  await req.supabase.from("spaces").delete().eq("owner_id", req.userId);
  await req.supabase.from("space_members").delete().eq("user_id", req.userId);
  await req.supabase.from("sync_sources").delete().eq("user_id", req.userId);
  await req.supabase.from("profiles").delete().eq("id", req.userId);

  const { error } = await serviceClient.auth.admin.deleteUser(req.userId);
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.status(204).send();
});

export default router;
