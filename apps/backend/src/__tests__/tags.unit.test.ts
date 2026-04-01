import { describe, it, expect, vi } from "vitest";
import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import tagsRouter from "../routes/tags";

/**
 * Unit tests for GET /api/v1/tags
 *
 * We mount the tags router on a small Express app with a fake auth
 * middleware that injects `req.userId` and a mock `req.supabase`.
 */

function createTestApp(supabaseMock: unknown) {
  const app = express();
  app.use(express.json());

  // Fake auth middleware — inject userId and supabase mock
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.userId = "user-123";
    req.supabase = supabaseMock as Request["supabase"];
    next();
  });

  app.use("/api/v1/tags", tagsRouter);
  return app;
}

function mockSupabase(data: { tags: string[] | null }[] | null, error: { message: string } | null = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
}

describe("GET /api/v1/tags", () => {
  it("returns deduplicated, sorted tags for a user with tagged bookmarks", async () => {
    const supabase = mockSupabase([
      { tags: ["react", "typescript"] },
      { tags: ["react", "ai"] },
      { tags: [] },
    ]);

    const app = createTestApp(supabase);
    const res = await request(app).get("/api/v1/tags");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(["ai", "react", "typescript"]);
  });

  it("returns empty array when user has no bookmarks", async () => {
    const supabase = mockSupabase([]);

    const app = createTestApp(supabase);
    const res = await request(app).get("/api/v1/tags");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns empty array when all bookmarks have empty tag arrays", async () => {
    const supabase = mockSupabase([
      { tags: [] },
      { tags: [] },
    ]);

    const app = createTestApp(supabase);
    const res = await request(app).get("/api/v1/tags");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("handles null tags gracefully", async () => {
    const supabase = mockSupabase([
      { tags: null },
      { tags: ["react"] },
    ]);

    const app = createTestApp(supabase);
    const res = await request(app).get("/api/v1/tags");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(["react"]);
  });

  it("returns 500 when Supabase query fails", async () => {
    const supabase = mockSupabase(null, { message: "Database error" });

    const app = createTestApp(supabase);
    const res = await request(app).get("/api/v1/tags");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Database error" });
  });

  it("queries bookmarks filtered by user_id", async () => {
    const supabase = mockSupabase([]);

    const app = createTestApp(supabase);
    await request(app).get("/api/v1/tags");

    expect(supabase.from).toHaveBeenCalledWith("bookmarks");
    const fromReturn = supabase.from.mock.results[0].value;
    expect(fromReturn.select).toHaveBeenCalledWith("tags");
    const selectReturn = fromReturn.select.mock.results[0].value;
    expect(selectReturn.eq).toHaveBeenCalledWith("user_id", "user-123");
  });
});
