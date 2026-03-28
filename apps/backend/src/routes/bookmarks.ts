import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { validateBody, validateQuery } from "../middleware/validate";
import { detectSourceType, getPaginationParams } from "../services/bookmarkService";
import { serviceClient } from "../config/supabase";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const listQuerySchema = z.object({
  type: z.string().optional(),
  sort: z.enum(["created_at", "title", "source_type"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const createSchema = z.object({
  url: z.string().url().optional(),
  content_type: z.enum(["link", "note", "image", "pdf", "file"]),
  title: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  space_ids: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
  raw_content: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  space_ids: z.array(z.string().uuid()).optional(),
});

// GET /
router.get("/", validateQuery(listQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const { type, sort, order, page, limit } = req.query as unknown as z.infer<typeof listQuerySchema>;
  const { offset } = getPaginationParams({ page, limit });

  let query = req.supabase
    .from("bookmarks")
    .select(`*, bookmark_spaces(space_id, spaces(id, name))`, { count: "exact" })
    .eq("user_id", req.userId)
    .order(sort as string, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq("content_type", type);

  const { data, error, count } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json({ data, total: count, page, limit });
});

// GET /:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("bookmarks")
    .select(`*, bookmark_spaces(space_id, spaces(id, name))`)
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .single();

  if (error) { res.status(404).json({ error: "Bookmark not found" }); return; }
  res.json(data);
});

// POST /
router.post("/", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  // Parse body (multipart fields come as strings)
  const parseResult = createSchema.safeParse({
    ...req.body,
    space_ids: req.body.space_ids ? JSON.parse(req.body.space_ids) : undefined,
    tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
  });
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues.map((i) => `${i.path}: ${i.message}`).join(", ") });
    return;
  }

  const body = parseResult.data;
  const source_type = detectSourceType(body.url);
  const enrichment_status = body.content_type === "note" ? "completed" : "pending";

  let file_path: string | null = null;
  let signed_url: string | null = null;

  // Handle file upload
  if (req.file) {
    const storagePath = `user-uploads/${req.userId}/${crypto.randomUUID()}-${req.file.originalname}`;
    const { error: uploadError } = await serviceClient.storage
      .from("user-uploads")
      .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) { res.status(500).json({ error: uploadError.message }); return; }

    file_path = storagePath;
    const { data: urlData } = await serviceClient.storage
      .from("user-uploads")
      .createSignedUrl(storagePath, 3600);
    signed_url = urlData?.signedUrl ?? null;
  }

  const insertData: Record<string, unknown> = {
    user_id: req.userId,
    url: body.url ?? null,
    content_type: body.content_type,
    title: body.title ?? null,
    description: body.description ?? null,
    notes: body.notes ?? null,
    tags: body.tags ?? [],
    raw_content: body.content_type === "note" ? body.raw_content : null,
    source_type,
    enrichment_status,
    file_path,
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

  res.status(201).json({ ...bookmark, signed_url });
});

// PATCH /:id
router.patch("/:id", validateBody(updateSchema), async (req: Request, res: Response): Promise<void> => {
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

  if (error) { res.status(404).json({ error: "Bookmark not found or unauthorized" }); return; }

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
});

// DELETE /:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { error } = await req.supabase
    .from("bookmarks")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (error) { res.status(404).json({ error: "Bookmark not found or unauthorized" }); return; }
  res.status(204).send();
});

export default router;
