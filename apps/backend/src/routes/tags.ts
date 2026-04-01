import { Router, Request, Response } from "express";
import { asyncHandler } from "@brain-feed/logger";

const router = Router();

// GET /
router.get("/", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("bookmarks")
    .select("tags")
    .eq("user_id", req.userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Flatten all tag arrays, deduplicate, and sort alphabetically
  const allTags = (data ?? []).flatMap((row: { tags: string[] | null }) => row.tags ?? []);
  const unique = [...new Set(allTags)].sort((a, b) => a.localeCompare(b));

  res.json(unique);
}));

export default router;
