import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateBody, validateQuery } from "../middleware/validate";
import { getPaginationParams } from "../utils/pagination";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  ai_auto_categorize: z.boolean().optional(),
});

const listBookmarksQuerySchema = z.object({
  sort: z.enum(["created_at", "title", "source_type"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// GET / — list all spaces the user owns or is a member of
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { data: owned, error: e1 } = await req.supabase
    .from("spaces")
    .select(`*, bookmark_spaces(count), space_members(user_id, role, profiles(display_name, avatar_url))`)
    .eq("owner_id", req.userId);

  const { data: memberSpaces, error: e2 } = await req.supabase
    .from("space_members")
    .select(`spaces(*, bookmark_spaces(count), space_members(user_id, role, profiles(display_name, avatar_url)))`)
    .eq("user_id", req.userId)
    .not("accepted_at", "is", null);

  if (e1 || e2) {
    res.status(500).json({ error: e1?.message ?? e2?.message });
    return;
  }

  const memberSpaceList = (memberSpaces ?? []).map((r: Record<string, unknown>) => r.spaces).filter(Boolean);
  const allSpaces = [...(owned ?? []), ...memberSpaceList];
  res.json({ data: allSpaces });
});

// GET /:id
router.get("/:id", validateQuery(listBookmarksQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const { sort, order, type, page, limit } = req.query as unknown as z.infer<typeof listBookmarksQuerySchema>;
  const { offset } = getPaginationParams({ page, limit });

  const { data: space, error } = await req.supabase
    .from("spaces")
    .select(`*, space_members(user_id, role, profiles(display_name, avatar_url))`)
    .eq("id", req.params.id)
    .single();

  if (error) { res.status(404).json({ error: "Space not found" }); return; }

  let bookmarkQuery = req.supabase
    .from("bookmarks")
    .select(`*, bookmark_spaces!inner(space_id)`, { count: "exact" })
    .eq("bookmark_spaces.space_id", req.params.id)
    .order(sort as string, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  if (type) bookmarkQuery = bookmarkQuery.eq("content_type", type);

  const { data: bookmarks, count, error: be } = await bookmarkQuery;
  if (be) { res.status(500).json({ error: be.message }); return; }

  res.json({ ...space, bookmarks: { data: bookmarks, total: count, page, limit } });
});

// POST /
router.post("/", validateBody(createSchema), async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("spaces")
    .insert({ ...req.body, owner_id: req.userId })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// PATCH /:id
router.patch("/:id", validateBody(updateSchema), async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("spaces")
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("owner_id", req.userId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Space not found or unauthorized" }); return; }
  res.json(data);
});

// DELETE /:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { error } = await req.supabase
    .from("spaces")
    .delete()
    .eq("id", req.params.id)
    .eq("owner_id", req.userId);

  if (error) { res.status(404).json({ error: "Space not found or unauthorized" }); return; }
  res.status(204).send();
});

// POST /:id/share
router.post("/:id/share", async (req: Request, res: Response): Promise<void> => {
  const shareToken = crypto.randomUUID();
  const { data, error } = await req.supabase
    .from("spaces")
    .update({ share_token: shareToken, is_public: true, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("owner_id", req.userId)
    .select("id, share_token")
    .single();

  if (error) { res.status(404).json({ error: "Space not found or unauthorized" }); return; }
  res.json(data);
});

// DELETE /:id/share
router.delete("/:id/share", async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("spaces")
    .update({ share_token: null, is_public: false, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("owner_id", req.userId)
    .select("id")
    .single();

  if (error) { res.status(404).json({ error: "Space not found or unauthorized" }); return; }
  res.json(data);
});

export default router;
