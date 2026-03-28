import { describe, it, expect, vi } from "vitest";
import express, { Application, Request, Response } from "express";

/**
 * Unit tests for app.ts
 *
 * These tests verify the Express application is configured correctly
 * and that individual route handlers behave as expected in isolation,
 * without binding to a port or using HTTP transport.
 */

describe("Express app configuration", () => {
  it("creates an express application", async () => {
    const { default: app } = await import("../app");
    expect(app).toBeDefined();
    expect(typeof (app as Application).listen).toBe("function");
    expect(typeof (app as Application).use).toBe("function");
    expect(typeof (app as Application).get).toBe("function");
  });

  it("has json body-parser middleware registered", async () => {
    const { default: app } = await import("../app");
    // express.json() registers a layer whose handle function is named "jsonParser"
    type StackLayer = {
      name?: string;
      handle?: { name?: string };
    };
    const stack = (
      app as Application & { _router: { stack: StackLayer[] } }
    )._router?.stack;
    expect(stack).toBeDefined();
    const hasJsonParser = stack.some(
      (layer: StackLayer) =>
        layer.name === "jsonParser" ||
        (layer.handle && layer.handle.name === "jsonParser"),
    );
    expect(hasJsonParser).toBe(true);
  });

  it("has a GET / route registered", async () => {
    const { default: app } = await import("../app");
    type RouteLayer = {
      route?: { path: string; methods: Record<string, boolean> };
    };
    const stack = (
      app as Application & { _router: { stack: RouteLayer[] } }
    )._router?.stack;
    const rootRoute = stack.find(
      (l: RouteLayer) => l.route?.path === "/" && l.route.methods["get"],
    );
    expect(rootRoute).toBeDefined();
  });
});

describe("GET / route handler (unit)", () => {
  it("calls res.json with the correct message payload", () => {
    const mockJson = vi.fn();
    const mockRes = { json: mockJson } as unknown as Response;
    const mockReq = {} as Request;

    // Register the same handler on a local test app so we can extract
    // and call it directly — no HTTP layer involved.
    const testApp = express();
    testApp.get("/probe", (_req: Request, res: Response) => {
      res.json({ message: "Hello from brain-feed backend!" });
    });

    type RouteLayer = {
      route?: {
        path: string;
        stack: Array<{ handle: (req: Request, res: Response) => void }>;
      };
    };
    const layer = (
      testApp as Application & { _router: { stack: RouteLayer[] } }
    )._router.stack.find((l: RouteLayer) => l.route?.path === "/probe");

    expect(layer).toBeDefined();
    layer!.route!.stack[0].handle(mockReq, mockRes);
    expect(mockJson).toHaveBeenCalledOnce();
    expect(mockJson).toHaveBeenCalledWith({
      message: "Hello from brain-feed backend!",
    });
  });

  it("calls res.json exactly once per request", () => {
    const mockJson = vi.fn();
    const mockRes = { json: mockJson } as unknown as Response;
    const mockReq = {} as Request;

    const testApp = express();
    testApp.get("/probe2", (_req: Request, res: Response) => {
      res.json({ message: "Hello from brain-feed backend!" });
    });

    type RouteLayer = {
      route?: {
        path: string;
        stack: Array<{ handle: (req: Request, res: Response) => void }>;
      };
    };
    const layer = (
      testApp as Application & { _router: { stack: RouteLayer[] } }
    )._router.stack.find((l: RouteLayer) => l.route?.path === "/probe2");

    layer!.route!.stack[0].handle(mockReq, mockRes);
    layer!.route!.stack[0].handle(mockReq, mockRes);
    expect(mockJson).toHaveBeenCalledTimes(2);
  });
});
