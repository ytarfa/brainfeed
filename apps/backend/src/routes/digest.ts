import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateBody, validateQuery } from "../middleware/validate";

const router = Router();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const listQuerySchema = z.object({
  source_type: z.string().optional(),
});

const dismissGroupSchema = z.object({
  source_name: z.string().min(1),
  source_type: z.string().optional(),
});

// ---------------------------------------------------------------------------
// GET / — list active digest bookmarks grouped by source
// ---------------------------------------------------------------------------
router.get(
  "/",
  validateQuery(listQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    const { source_type } = req.query as z.infer<typeof listQuerySchema>;

    let query = req.supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", req.userId)
      .eq("digest_status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (source_type) {
      query = query.eq("source_type", source_type);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Group by source_name
    const groups: Record<string, { source_name: string; source_type: string; candidates: typeof data }> = {};

    for (const bookmark of data ?? []) {
      const key = bookmark.source_name ?? bookmark.source_type ?? "unknown";
      if (!groups[key]) {
        groups[key] = {
          source_name: bookmark.source_name ?? bookmark.source_type ?? "Unknown",
          source_type: bookmark.source_type ?? "generic",
          candidates: [],
        };
      }
      groups[key].candidates.push(bookmark);
    }

    res.json({ data: Object.values(groups) });
  },
);

// ---------------------------------------------------------------------------
// GET /summary — count + group summary for banner and sidebar badge
// ---------------------------------------------------------------------------
router.get("/summary", async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("bookmarks")
    .select("source_name, source_type")
    .eq("user_id", req.userId)
    .eq("digest_status", "active")
    .gt("expires_at", new Date().toISOString());

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const items = data ?? [];
  const groupCounts: Record<string, { source_name: string; source_type: string; count: number }> = {};

  for (const item of items) {
    const key = item.source_name ?? item.source_type ?? "unknown";
    if (!groupCounts[key]) {
      groupCounts[key] = {
        source_name: item.source_name ?? item.source_type ?? "Unknown",
        source_type: item.source_type ?? "generic",
        count: 0,
      };
    }
    groupCounts[key].count++;
  }

  res.json({
    total: items.length,
    groups: Object.values(groupCounts),
  });
});

// ---------------------------------------------------------------------------
// POST /:id/save — promote digest bookmark to regular bookmark
// ---------------------------------------------------------------------------
router.post("/:id/save", async (req: Request, res: Response): Promise<void> => {
  const { data: bookmark, error } = await req.supabase
    .from("bookmarks")
    .update({ digest_status: "saved", updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .eq("digest_status", "active")
    .select()
    .single();

  if (error || !bookmark) {
    res.status(404).json({ error: "Candidate not found or already acted on" });
    return;
  }

  res.status(200).json(bookmark);
});

// ---------------------------------------------------------------------------
// POST /:id/dismiss — mark digest bookmark as dismissed
// ---------------------------------------------------------------------------
router.post("/:id/dismiss", async (req: Request, res: Response): Promise<void> => {
  const { error } = await req.supabase
    .from("bookmarks")
    .update({ digest_status: "dismissed", updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .eq("digest_status", "active");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(204).send();
});

// ---------------------------------------------------------------------------
// POST /dismiss-all — bulk dismiss all active digest bookmarks
// ---------------------------------------------------------------------------
router.post("/dismiss-all", async (req: Request, res: Response): Promise<void> => {
  const { error } = await req.supabase
    .from("bookmarks")
    .update({ digest_status: "dismissed", updated_at: new Date().toISOString() })
    .eq("user_id", req.userId)
    .eq("digest_status", "active");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(204).send();
});

// ---------------------------------------------------------------------------
// POST /dismiss-group — bulk dismiss by source_name (and optionally source_type)
// ---------------------------------------------------------------------------
router.post(
  "/dismiss-group",
  validateBody(dismissGroupSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { source_name, source_type } = req.body as z.infer<typeof dismissGroupSchema>;

    let query = req.supabase
      .from("bookmarks")
      .update({ digest_status: "dismissed", updated_at: new Date().toISOString() })
      .eq("user_id", req.userId)
      .eq("digest_status", "active")
      .eq("source_name", source_name);

    if (source_type) {
      query = query.eq("source_type", source_type);
    }

    const { error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(204).send();
  },
);

// ---------------------------------------------------------------------------
// DELETE /expired — purge expired or dismissed digest bookmarks
// ---------------------------------------------------------------------------
router.delete("/expired", async (req: Request, res: Response): Promise<void> => {
  // Delete dismissed digest bookmarks
  const { error: dismissedError } = await req.supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", req.userId)
    .eq("digest_status", "dismissed");

  if (dismissedError) {
    res.status(500).json({ error: dismissedError.message });
    return;
  }

  // Delete expired active digest bookmarks
  const { error: expiredError } = await req.supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", req.userId)
    .eq("digest_status", "active")
    .lt("expires_at", new Date().toISOString());

  if (expiredError) {
    res.status(500).json({ error: expiredError.message });
    return;
  }

  res.status(204).send();
});

export default router;
