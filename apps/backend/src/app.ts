import express, { Application, Request, Response } from "express";

const app: Application = express();

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Hello from brain-feed backend!" });
});

export default app;
