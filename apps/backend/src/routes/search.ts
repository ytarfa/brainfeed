import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateQuery } from "../middleware/validate";
import { getPaginationParams } from "../utils/pagination";

const router = Router();

const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.string().optional(),
  space_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

router.get("/", validateQuery(searchQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const { q, type, space_id, page, limit } = req.query as unknown as z.infer<typeof searchQuerySchema>;
  const { offset } = getPaginationParams({ page, limit });

  let query = req.supabase
    .from("bookmarks")
    .select(`*, bookmark_spaces(space_id, spaces(id, name))`, { count: "exact" })
    .eq("user_id", req.userId)
    .textSearch(
      "fts",
      q,
      { type: "plain", config: "english" }
    )
    .range(offset, offset + limit - 1);

  if (type) query = query.eq("content_type", type);
  if (space_id) {
    query = query.eq("bookmark_spaces.space_id", space_id);
  }

  const { data, error, count } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json({ data, total: count, page, limit });
});

export default router;
