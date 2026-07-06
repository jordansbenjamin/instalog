import { describe, it, expect, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { createFeedbackRouter } from "./feedback";
import type { EmailSender } from "../feedback/sendFeedbackEmail";

const FIXED_NOW = 1_000_000;

function makeApp(emailSender: EmailSender | null, now: () => number = () => FIXED_NOW): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/feedback", createFeedbackRouter({ emailSender, now }));
  return app;
}

function fakeSender(): EmailSender & { send: ReturnType<typeof vi.fn> } {
  return { send: vi.fn(async () => {}) };
}

const VALID = { type: "bug", message: "It broke.", context: {} };

describe("POST /api/feedback", () => {
  it("returns 503 when unconfigured", async () => {
    const res = await request(makeApp(null)).post("/api/feedback").send(VALID);
    expect(res.status).toBe(503);
    expect(res.body.error).toBe("not_configured");
  });

  it("returns 400 on a missing message", async () => {
    const sender = fakeSender();
    const res = await request(makeApp(sender)).post("/api/feedback").send({ type: "bug", context: {} });
    expect(res.status).toBe(400);
    expect(sender.send).not.toHaveBeenCalled();
  });

  it("silently drops (200, no send) when the honeypot is filled", async () => {
    const sender = fakeSender();
    const res = await request(makeApp(sender))
      .post("/api/feedback")
      .send({ ...VALID, honeypot: "i am a bot" });
    expect(res.status).toBe(200);
    expect(sender.send).not.toHaveBeenCalled();
  });

  it("sends on the happy path", async () => {
    const sender = fakeSender();
    const res = await request(makeApp(sender)).post("/api/feedback").send(VALID);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(sender.send).toHaveBeenCalledTimes(1);
    expect(sender.send.mock.calls[0][0]).toMatchObject({ type: "bug", message: "It broke." });
  });

  it("returns 502 and logs the payload when the send fails", async () => {
    const sender: EmailSender = { send: vi.fn(async () => { throw new Error("resend down"); }) };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(makeApp(sender)).post("/api/feedback").send(VALID);
    expect(res.status).toBe(502);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("rate-limits after the per-window cap", async () => {
    const sender = fakeSender();
    const app = makeApp(sender);
    for (let i = 0; i < 5; i += 1) {
      await request(app).post("/api/feedback").send(VALID);
    }
    const res = await request(app).post("/api/feedback").send(VALID);
    expect(res.status).toBe(429);
  });
});
