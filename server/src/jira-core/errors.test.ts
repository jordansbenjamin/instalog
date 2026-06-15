import { describe, it, expect } from "vitest";
import { JiraCoreError, classifyStatus } from "./errors";

describe("classifyStatus", () => {
  it("maps known auth/permission/not-found statuses", () => {
    expect(classifyStatus(401)).toBe("auth");
    expect(classifyStatus(403)).toBe("permission");
    expect(classifyStatus(404)).toBe("not-found");
  });

  it("treats any 5xx as a server problem", () => {
    expect(classifyStatus(500)).toBe("server");
    expect(classifyStatus(503)).toBe("server");
  });

  it("falls back to unknown for unrecognised statuses", () => {
    expect(classifyStatus(400)).toBe("unknown");
    expect(classifyStatus(418)).toBe("unknown");
  });
});

describe("JiraCoreError", () => {
  it("is an Error carrying a kind, message, and optional status", () => {
    const error = new JiraCoreError("auth", "token rejected", 401);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("JiraCoreError");
    expect(error.kind).toBe("auth");
    expect(error.message).toBe("token rejected");
    expect(error.status).toBe(401);
  });

  it("leaves status undefined when not provided (e.g. network failures)", () => {
    const error = new JiraCoreError("network", "fetch failed");
    expect(error.status).toBeUndefined();
  });
});
