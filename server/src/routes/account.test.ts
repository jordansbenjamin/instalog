import { describe, it, expect } from "vitest";
import { initialsOf, hostFromUrl, toAccount } from "./account";

describe("initialsOf", () => {
  it("takes the first letter of the first and last name, uppercased", () => {
    expect(initialsOf("Maddy Chen")).toBe("MC");
    expect(initialsOf("Demo User")).toBe("DU");
  });

  it("uses first + last across a middle name", () => {
    expect(initialsOf("Mary Jane Watson")).toBe("MW");
  });

  it("returns a single initial for a one-word name", () => {
    expect(initialsOf("Cher")).toBe("C");
  });

  it("returns empty string for blank input", () => {
    expect(initialsOf("   ")).toBe("");
    expect(initialsOf("")).toBe("");
  });
});

describe("hostFromUrl", () => {
  it("extracts the host from a site url", () => {
    expect(hostFromUrl("https://graphite.atlassian.net")).toBe(
      "graphite.atlassian.net",
    );
    expect(hostFromUrl("https://acme.atlassian.net/wiki")).toBe(
      "acme.atlassian.net",
    );
  });

  it("falls back to the raw value when it is not a url", () => {
    expect(hostFromUrl("not-a-url")).toBe("not-a-url");
  });
});

describe("toAccount", () => {
  it("assembles a non-demo account with derived initials", () => {
    expect(toAccount("Maddy Chen", "graphite.atlassian.net")).toEqual({
      name: "Maddy Chen",
      site: "graphite.atlassian.net",
      initials: "MC",
      isDemo: false,
    });
  });
});
