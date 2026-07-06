import { describe, it, expect, vi } from "vitest";
import { createEmailSender, type FeedbackEmailInput } from "./sendFeedbackEmail";
import type { ResendConfig } from "../config/resend";

const CONFIG: ResendConfig = {
  apiKey: "re_test",
  fromEmail: "onboarding@resend.dev",
  toEmail: "me@example.com",
};

const INPUT: FeedbackEmailInput = {
  type: "bug",
  message: "The submit button is stuck.",
  email: "reporter@example.com",
  context: {
    step: "preview",
    isDemo: false,
    appVersion: "1.4.0",
    userAgent: "jsdom",
    url: "http://localhost/",
    submittedAt: "2026-07-05T10:00:00.000Z",
  },
};

function okFetch() {
  // Pin the mock's generic to `typeof fetch` — otherwise Vitest 4 infers the
  // mock's parameter types from this zero-arg implementation, and
  // `fetchImpl.mock.calls[0]` below would type-check as an empty tuple.
  return vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));
}

describe("createEmailSender", () => {
  it("POSTs to the Resend endpoint with auth and mapped fields", async () => {
    const fetchImpl = okFetch();
    await createEmailSender(CONFIG, fetchImpl).send(INPUT);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_test");
    const body = JSON.parse(init?.body as string);
    expect(body.from).toBe("onboarding@resend.dev");
    expect(body.to).toEqual(["me@example.com"]);
    expect(body.reply_to).toBe("reporter@example.com");
    expect(body.subject).toContain("Bug");
    expect(body.text).toContain("The submit button is stuck.");
    expect(body.text).toContain("preview");
  });

  it("omits reply_to when no email is given", async () => {
    const fetchImpl = okFetch();
    await createEmailSender(CONFIG, fetchImpl).send({ ...INPUT, email: undefined });
    const body = JSON.parse(fetchImpl.mock.calls[0][1]?.body as string);
    expect(body.reply_to).toBeUndefined();
  });

  it("throws when Resend responds non-2xx", async () => {
    const fetchImpl = vi.fn(async () => new Response("rate limited", { status: 429 }));
    await expect(createEmailSender(CONFIG, fetchImpl).send(INPUT)).rejects.toThrow(/429/);
  });
});
