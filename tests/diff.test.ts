import { describe, it, expect } from "vitest";
import { computeStructuredDiff } from "../src/engine/diff.js";
import { normalizeDocument } from "../src/engine/normalization.js";

describe("Deterministic Diff Engine", () => {
  it("should produce reproducible diff results for identical inputs", () => {
    const v1 = `Payment Terms: 30 days\nLiability Cap: ₹50,000`;
    const v2 = `Payment Terms: 15 days\nLiability Cap: ₹1,00,000`;

    const run1 = computeStructuredDiff(v1, v2, "v1", "v2");
    const run2 = computeStructuredDiff(v1, v2, "v1", "v2");

    expect(run1).toEqual(run2);
    expect(run1.changes.length).toBe(2);
    expect(run1.changes[0].oldValue).toBe("30 days");
    expect(run1.changes[0].newValue).toBe("15 days");
  });

  it("should correctly detect ADDED, REMOVED, and MODIFIED clauses", () => {
    const vBase = `Payment Terms: 30 days\nOld Clause: Active`;
    const vTarget = `Payment Terms: 30 days\nNew Clause: Active`;

    const diff = computeStructuredDiff(vBase, vTarget, "vB", "vT");

    const removed = diff.changes.find((c) => c.type === "REMOVED");
    const added = diff.changes.find((c) => c.type === "ADDED");

    expect(removed).toBeDefined();
    expect(removed?.section).toBe("Old Clause");

    expect(added).toBeDefined();
    expect(added?.section).toBe("New Clause");
  });

  it("should normalize line endings correctly and produce identical content hashes", () => {
    const textWindows = "Line 1\r\nLine 2\r\n";
    const textUnix = "Line 1\nLine 2";

    const normWin = normalizeDocument(textWindows);
    const normUnix = normalizeDocument(textUnix);

    expect(normWin.contentHash).toBe(normUnix.contentHash);
  });
});
