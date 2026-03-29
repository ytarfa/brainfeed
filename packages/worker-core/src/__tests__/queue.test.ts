import { describe, it, expect, vi } from "vitest";
import { createQueue, createWorker } from "../queue";

// Mock bullmq
vi.mock("bullmq", () => {
  const MockQueue = vi.fn().mockImplementation((name, opts) => ({
    name,
    opts,
    add: vi.fn(),
    close: vi.fn(),
  }));

  const MockWorker = vi.fn().mockImplementation((name, processor, opts) => ({
    name,
    processor,
    opts,
    close: vi.fn(),
    on: vi.fn(),
  }));

  return { Queue: MockQueue, Worker: MockWorker };
});

// Mock ioredis for type compatibility
vi.mock("ioredis", () => {
  const MockRedis = vi.fn().mockImplementation(() => ({
    status: "ready",
    disconnect: vi.fn(),
  }));
  return { default: MockRedis };
});

describe("createQueue", () => {
  it("should create a BullMQ queue with the given name and connection", async () => {
    const Redis = (await import("ioredis")).default;
    const connection = new Redis() as unknown as import("ioredis").default;

    const queue = createQueue("enrichment", connection);

    expect(queue).toBeDefined();
    expect(queue.name).toBe("enrichment");
    expect(queue.opts.connection).toBe(connection);
  });

  it("should pass additional options to the queue", async () => {
    const Redis = (await import("ioredis")).default;
    const connection = new Redis() as unknown as import("ioredis").default;

    const queue = createQueue("enrichment", connection, {
      defaultJobOptions: { removeOnComplete: true },
    });

    expect(queue.opts.defaultJobOptions).toEqual({ removeOnComplete: true });
  });
});

describe("createWorker", () => {
  it("should create a BullMQ worker with the given name, processor, and connection", async () => {
    const Redis = (await import("ioredis")).default;
    const connection = new Redis() as unknown as import("ioredis").default;
    const processor = vi.fn();

    const worker = createWorker("enrichment", processor, connection);

    expect(worker).toBeDefined();
    expect(worker.name).toBe("enrichment");
    expect(worker.opts.connection).toBe(connection);
  });

  it("should pass additional options to the worker", async () => {
    const Redis = (await import("ioredis")).default;
    const connection = new Redis() as unknown as import("ioredis").default;
    const processor = vi.fn();

    const worker = createWorker("enrichment", processor, connection, {
      concurrency: 5,
    });

    expect(worker.opts.concurrency).toBe(5);
  });
});
