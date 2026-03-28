import { Request, Response, NextFunction } from "express";
import { createUserClient, serviceClient } from "../config/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      supabase: SupabaseClient;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const { data, error } = await serviceClient.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = data.user.id;
  req.supabase = createUserClient(token);
  next();
}
