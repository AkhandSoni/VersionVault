import { describe, it, expect } from "vitest";
import { classifyChange } from "../src/engine/materiality.js";

describe("Deterministic Materiality Classifier", () => {
  it("should classify financial changes with high severity", () => {
    const analysis = classifyChange("Payment Terms", "30 days", "15 days", "MODIFIED");
    expect(analysis.category).toBe("FINANCIAL");
    expect(analysis.severity).toBe("HIGH");
  });

  it("should classify liability cap increase as financial high severity", () => {
    const analysis = classifyChange("Liability Cap", "₹50,000", "₹1,00,000", "MODIFIED");
    expect(analysis.category).toBe("FINANCIAL");
    expect(analysis.severity).toBe("HIGH");
  });

  it("should classify termination clause changes as contractual high severity", () => {
    const analysis = classifyChange("Termination Notice", "30 days", "15 days", "MODIFIED");
    expect(analysis.category).toBe("CONTRACTUAL");
    expect(analysis.severity).toBe("HIGH");
  });

  it("should classify support level adjustments as operational", () => {
    const analysis = classifyChange("Support", "Business hours", "24/7", "MODIFIED");
    expect(analysis.category).toBe("OPERATIONAL");
  });
});
