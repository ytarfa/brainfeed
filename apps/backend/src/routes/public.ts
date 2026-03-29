import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateQuery } from "../middleware/validate";
import { serviceClient } from "../config/supabase";
import { getPaginationParams } from "../utils/pagination";

const router = Router();

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

router.get("/spaces/:shareToken", validateQuery(querySchema), async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = req.query as unknown as z.infer<typeof querySchema>;
  const { offset } = getPaginationParams({ page, limit });

  const { data: space, error } = await serviceClient
    .from("spaces")
    .select("id, name, description, created_at")
    .eq("share_token", req.params.shareToken)
    .eq("is_public", true)
    .single();

  if (error || !space) { res.status(404).json({ error: "Space not found or not public" }); return; }

  const { data: bookmarks, count, error: be } = await serviceClient
    .from("bookmarks")
    .select(
      `id, title, description, url, content_type, source_type, thumbnail_url, tags, created_at,
       bookmark_spaces!inner(space_id)`,
      { count: "exact" }
    )
    .eq("bookmark_spaces.space_id", space.id)
    .or("digest_status.is.null,digest_status.eq.saved")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (be) { res.status(500).json({ error: be.message }); return; }

  res.json({
    space,
    bookmarks: { data: bookmarks, total: count, page, limit },
  });
});

export default router;
