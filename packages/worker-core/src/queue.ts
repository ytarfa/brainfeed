import { Queue, Worker, Processor, QueueOptions, WorkerOptions } from "bullmq";
import type Redis from "ioredis";

export function createQueue(
  name: string,
  connection: Redis,
  opts?: Omit<QueueOptions, "connection">,
): Queue {
  return new Queue(name, {
    connection,
    ...opts,
  });
}

export function createWorker<T = unknown, R = unknown>(
  name: string,
  processor: Processor<T, R>,
  connection: Redis,
  opts?: Omit<WorkerOptions, "connection">,
): Worker<T, R> {
  return new Worker<T, R>(name, processor, {
    connection,
    ...opts,
  });
}
