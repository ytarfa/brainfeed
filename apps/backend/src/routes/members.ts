import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate";

const router = Router({ mergeParams: true });

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]),
});

const updateRoleSchema = z.object({
  role: z.enum(["editor", "viewer"]),
});

async function assertOwner(req: Request, res: Response): Promise<boolean> {
  const { data } = await req.supabase
    .from("spaces")
    .select("owner_id")
    .eq("id", req.params.spaceId)
    .single();

  if (!data || data.owner_id !== req.userId) {
    res.status(403).json({ error: "Only the space owner can manage members" });
    return false;
  }
  return true;
}

// GET /
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await req.supabase
    .from("space_members")
    .select(`id, role, invited_at, accepted_at, profiles(id, display_name, avatar_url)`)
    .eq("space_id", req.params.spaceId);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data });
});

// POST / — invite by email
router.post("/", validateBody(inviteSchema), async (req: Request, res: Response): Promise<void> => {
  if (!(await assertOwner(req, res))) return;

  const { email, role } = req.body as z.infer<typeof inviteSchema>;

  // Look up profile by email via auth (service client needed for this)
  // We use the profiles table joined to auth.users email via RPC or admin API
  // Simple approach: look up via auth admin
  const { serviceClient } = await import("../config/supabase");
  const { data: userList, error: lookupError } = await serviceClient.auth.admin.listUsers();
  if (lookupError) { res.status(500).json({ error: lookupError.message }); return; }

  const authUser = userList.users.find((u) => u.email === email);
  if (!authUser) {
    res.status(404).json({ error: "No user found with that email address" });
    return;
  }

  const { data, error } = await req.supabase
    .from("space_members")
    .insert({ space_id: req.params.spaceId, user_id: authUser.id, role })
    .select(`id, role, invited_at, accepted_at, profiles(id, display_name, avatar_url)`)
    .single();

  if (error) {
    if (error.code === "23505") {
      res.status(409).json({ error: "User is already a member of this space" });
    } else {
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.status(201).json(data);
});

// PATCH /:memberId
router.patch("/:memberId", validateBody(updateRoleSchema), async (req: Request, res: Response): Promise<void> => {
  if (!(await assertOwner(req, res))) return;

  const { data, error } = await req.supabase
    .from("space_members")
    .update({ role: req.body.role })
    .eq("id", req.params.memberId)
    .eq("space_id", req.params.spaceId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(data);
});

// DELETE /:memberId
router.delete("/:memberId", async (req: Request, res: Response): Promise<void> => {
  if (!(await assertOwner(req, res))) return;

  const { error } = await req.supabase
    .from("space_members")
    .delete()
    .eq("id", req.params.memberId)
    .eq("space_id", req.params.spaceId);

  if (error) { res.status(404).json({ error: "Member not found" }); return; }
  res.status(204).send();
});

export default router;
