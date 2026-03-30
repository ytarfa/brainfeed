import { Router, Request, Response } from "express";
import { z } from "zod";
import { NotFoundError } from "@brain-feed/error-types";
import { asyncHandler } from "@brain-feed/logger";
import { validateBody, validateQuery } from "../middleware/validate";
import { bookmarkService } from "../services/bookmarkService";
import { resolveThumbnail } from "../services/thumbnailService";
import { thumbnailGenerator } from "../services/thumbnailGenerator";
import { uploadThumbnail } from "../services/storageUploader";
import { getPaginationParams } from "../utils/pagination";
import { publishEnrichmentJob } from "../lib/enrichmentQueue";

const router = Router();

const listQuerySchema = z.object({
  type: z.string().optional(),
  sort: z.enum(["created_at", "title", "source_type"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const createSchema = z.object({
  url: z.string().url(),
  content_type: z.literal("link"),
  title: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  space_ids: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  space_ids: z.array(z.string().uuid()).optional(),
});

// GET /
router.get("/", validateQuery(listQuerySchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { type, sort, order, page, limit } = req.query as unknown as z.infer<typeof listQuerySchema>;
  const { offset } = getPaginationParams({ page, limit });

  let query = req.supabase
    .from("bookmarks")
    .select(`*, bookmark_spaces(space_id, spaces(id, name))`, { count: "exact" })
    .eq("user_id", req.userId)
    .or("digest_status.is.null,digest_status.eq.saved")
    .order(sort as string, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq("content_type", type);

  const { data, error, count } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json({ data, total: count, page, limit });
}));

// GET /:id
router.get("/:id", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("bookmarks")
    .select(`*, bookmark_spaces(space_id, spaces(id, name))`)
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .single();

  if (error) throw new NotFoundError("Bookmark not found");
  res.json(data);
}));

// POST /
router.post("/", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const parseResult = createSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues.map((i) => `${i.path}: ${i.message}`).join(", ") });
    return;
  }

  const body = parseResult.data;

  // Detect source type (async — fetches OG data for non-github/youtube URLs)
  const { sourceType: source_type, ogMetadata } = await bookmarkService.detectSourceType(body.url);

  // Resolve thumbnail:
  // - For articles with OG data: generate composite image (uploaded after insert)
  // - For github/youtube: URL construction (no fetch)
  // - For generic with OG data: use already-fetched og:image
  // - Fallback: OG fetch via thumbnailService
  let thumbnail_url: string | null;
  const shouldGenerateArticleThumbnail = source_type === "article" && ogMetadata;

  if (shouldGenerateArticleThumbnail) {
    // Use og:image initially; we'll replace with composite after insert (need bookmark ID)
    thumbnail_url = ogMetadata.image;
  } else {
    thumbnail_url = ogMetadata?.image ?? await resolveThumbnail(body.url, source_type);
  }

  // Auto-fill title and description from OG metadata when not provided by user
  const title = body.title ?? ogMetadata?.title ?? null;
  const description = body.description ?? ogMetadata?.description ?? null;

  const insertData: Record<string, unknown> = {
    user_id: req.userId,
    url: body.url,
    content_type: "link",
    title,
    description,
    notes: body.notes ?? null,
    tags: body.tags ?? [],
    source_type,
    enrichment_status: "pending",
    file_path: null,
    thumbnail_url,
  };

  const { data: bookmark, error } = await req.supabase
    .from("bookmarks")
    .insert(insertData)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }

  // Associate with spaces
  if (body.space_ids?.length) {
    const spaceRows = body.space_ids.map((sid) => ({
      bookmark_id: bookmark.id,
      space_id: sid,
      added_by: "user",
    }));
    await req.supabase.from("bookmark_spaces").insert(spaceRows);
  }

  res.status(201).json(bookmark);

  // Fire-and-forget: generate composite article thumbnail
  if (shouldGenerateArticleThumbnail) {
    thumbnailGenerator.generate(source_type, ogMetadata).then(async (imageBuffer) => {
      if (!imageBuffer) return;
      const publicUrl = await uploadThumbnail(imageBuffer, bookmark.id);
      if (!publicUrl) return;
      await req.supabase
        .from("bookmarks")
        .update({ thumbnail_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", bookmark.id);
    }).catch(() => { /* best-effort, og:image is already stored */ });
  }

  // Fire-and-forget: publish enrichment job
  publishEnrichmentJob({
    bookmarkId: bookmark.id,
    userId: req.userId,
    contentType: "link",
    sourceType: source_type,
    url: body.url,
  });
}));

// PATCH /:id
router.patch("/:id", validateBody(updateSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { space_ids, ...fields } = req.body as z.infer<typeof updateSchema>;

  const updateData: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() };
  // Remove undefined keys
  Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

  const { data: bookmark, error } = await req.supabase
    .from("bookmarks")
    .update(updateData)
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select()
    .single();

  if (error) throw new NotFoundError("Bookmark not found or unauthorized");

  // Reconcile spaces if provided
  if (space_ids !== undefined) {
    await req.supabase.from("bookmark_spaces").delete().eq("bookmark_id", req.params.id);
    if (space_ids.length) {
      const rows = space_ids.map((sid) => ({
        bookmark_id: req.params.id,
        space_id: sid,
        added_by: "user",
      }));
      await req.supabase.from("bookmark_spaces").insert(rows);
    }
  }

  res.json(bookmark);
}));

// DELETE /:id
router.delete("/:id", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { error } = await req.supabase
    .from("bookmarks")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (error) throw new NotFoundError("Bookmark not found or unauthorized");
  res.status(204).send();
}));

export default router;
