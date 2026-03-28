import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate";

const router = Router();

const createSchema = z.object({
  platform: z.enum(["youtube", "spotify", "rss", "reddit"]),
  external_id: z.string().min(1),
  external_name: z.string().optional(),
  space_id: z.string().uuid(),
  sync_frequency: z.enum(["15min", "1h", "6h", "daily"]),
});

const updateSchema = z.object({
  sync_frequency: z.enum(["15min", "1h", "6h", "daily"]).optional(),
  space_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});

// GET /
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("sync_sources")
    .select(`*, spaces(id, name)`)
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data });
});

// POST /
router.post("/", validateBody(createSchema), async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("sync_sources")
    .insert({ ...req.body, user_id: req.userId })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// PATCH /:id
router.patch("/:id", validateBody(updateSchema), async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("sync_sources")
    .update(req.body)
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Sync source not found or unauthorized" }); return; }
  res.json(data);
});

// DELETE /:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { error } = await req.supabase
    .from("sync_sources")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (error) { res.status(404).json({ error: "Sync source not found or unauthorized" }); return; }
  res.status(204).send();
});

export default router;
