import { describe, it, expect, afterAll } from "vitest";
import { startHealthServer } from "../health";
import type { Server } from "http";

describe("startHealthServer", () => {
  let server: Server;

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  it("responds to /health with status ok", async () => {
    const port = 9876; // High port to avoid conflicts
    server = startHealthServer(port);

    // Wait for server to start listening
    await new Promise<void>((resolve) => {
      server.on("listening", resolve);
    });

    const res = await fetch(`http://localhost:${port}/health`);
    const body = await res.json() as { status: string; queue: string; timestamp: string };

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.queue).toBe("enrichment");
    expect(body.timestamp).toBeDefined();
    expect(typeof body.timestamp).toBe("string");
  });

  it("returns 404 for unknown routes", async () => {
    const port = 9876;
    const res = await fetch(`http://localhost:${port}/unknown`);
    expect(res.status).toBe(404);
  });
});
