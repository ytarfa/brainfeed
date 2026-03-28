import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate";

const router = Router({ mergeParams: true });

const createSchema = z.object({
  rule_type: z.enum(["domain", "url_contains", "source_type", "keyword"]),
  rule_value: z.string().min(1),
});

const updateSchema = z.object({
  rule_type: z.enum(["domain", "url_contains", "source_type", "keyword"]).optional(),
  rule_value: z.string().min(1).optional(),
});

// Verify user has access to this space (owner or editor)
async function assertSpaceAccess(req: Request, res: Response): Promise<boolean> {
  const { data: space } = await req.supabase
    .from("spaces")
    .select("id, owner_id")
    .eq("id", req.params.spaceId)
    .single();

  if (!space) { res.status(404).json({ error: "Space not found" }); return false; }
  if (space.owner_id === req.userId) return true;

  const { data: member } = await req.supabase
    .from("space_members")
    .select("role")
    .eq("space_id", req.params.spaceId)
    .eq("user_id", req.userId)
    .single();

  if (!member || member.role !== "editor") {
    res.status(403).json({ error: "Insufficient permissions" });
    return false;
  }
  return true;
}

// GET /
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("categorization_rules")
    .select("*")
    .eq("space_id", req.params.spaceId)
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data });
});

// POST /
router.post("/", validateBody(createSchema), async (req: Request, res: Response): Promise<void> => {
  if (!(await assertSpaceAccess(req, res))) return;

  const { data, error } = await req.supabase
    .from("categorization_rules")
    .insert({ ...req.body, space_id: req.params.spaceId, created_by: req.userId })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// PATCH /:ruleId
router.patch("/:ruleId", validateBody(updateSchema), async (req: Request, res: Response): Promise<void> => {
  if (!(await assertSpaceAccess(req, res))) return;

  const { data, error } = await req.supabase
    .from("categorization_rules")
    .update(req.body)
    .eq("id", req.params.ruleId)
    .eq("space_id", req.params.spaceId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Rule not found" }); return; }
  res.json(data);
});

// DELETE /:ruleId
router.delete("/:ruleId", async (req: Request, res: Response): Promise<void> => {
  if (!(await assertSpaceAccess(req, res))) return;

  const { error } = await req.supabase
    .from("categorization_rules")
    .delete()
    .eq("id", req.params.ruleId)
    .eq("space_id", req.params.spaceId);

  if (error) { res.status(404).json({ error: "Rule not found" }); return; }
  res.status(204).send();
});

export default router;
