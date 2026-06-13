import { describe, it, expect } from "vitest";
import { formatDate, formatTime, formatDuration } from "./format";

describe("formatDate", () => {
  it("formats a ParsedDate into weekday + day + month + 4-digit year", () => {
    // 16/3/26 → Monday 16 Mar 2026 (matches the design's "Mon, 16 Mar")
    expect(formatDate({ year: 26, month: 3, day: 16 })).toEqual({
      weekday: "Mon",
      day: 16,
      month: "Mar",
      year: 2026,
    });
  });

  it("returns null for a missing date", () => {
    expect(formatDate(null)).toBeNull();
  });
});

describe("formatTime", () => {
  it("formats morning times", () => {
    expect(formatTime(520)).toBe("8:40 am"); // 8:40am
    expect(formatTime(600)).toBe("10:00 am"); // 10am
  });

  it("formats noon and afternoon times", () => {
    expect(formatTime(720)).toBe("12:00 pm"); // noon
    expect(formatTime(795)).toBe("1:15 pm"); // 1:15pm
    expect(formatTime(1260)).toBe("9:00 pm"); // 9pm
  });

  it("formats midnight as 12:00 am", () => {
    expect(formatTime(0)).toBe("12:00 am");
  });
});

describe("formatDuration", () => {
  it("formats sub-hour and multi-hour spans", () => {
    expect(formatDuration(38)).toBe("0h 38m");
    expect(formatDuration(128)).toBe("2h 8m");
    expect(formatDuration(60)).toBe("1h 0m");
  });

  it("never goes negative", () => {
    expect(formatDuration(-10)).toBe("0h 0m");
  });
});
