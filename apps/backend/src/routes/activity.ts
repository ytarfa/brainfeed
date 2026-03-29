import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateQuery } from "../middleware/validate";
import { getPaginationParams } from "../utils/pagination";

const router = Router({ mergeParams: true });

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

router.get("/", validateQuery(querySchema), async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = req.query as unknown as z.infer<typeof querySchema>;
  const { offset } = getPaginationParams({ page, limit });

  const { data, error, count } = await req.supabase
    .from("activity_log")
    .select(
      `id, action, details, created_at,
       bookmarks(id, title),
       profiles(id, display_name, avatar_url)`,
      { count: "exact" }
    )
    .eq("space_id", req.params.spaceId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data, total: count, page, limit });
});

export default router;
