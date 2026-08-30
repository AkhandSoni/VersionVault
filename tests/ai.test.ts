import { describe, it, expect } from "vitest";
import { GroqGateway, DEFAULT_AI_UNAVAILABLE_MSG } from "../src/ai/gateway.js";
import { explainStructuredChanges } from "../src/ai/explainer.js";
import { answerHistoryQuestion } from "../src/ai/historyQa.js";
import { StructuredChange } from "../src/types/contracts.js";

describe("AI Gateway & Fallback Layer", () => {
  it("should return the exact user specified unavailable message when API key is missing or calls fail", async () => {
    const gateway = new GroqGateway({ apiKey: "" });

    const changes: StructuredChange[] = [
      {
        id: "chg1",
        baseVersionId: "v1",
        targetVersionId: "v2",
        type: "MODIFIED",
        section: "Payment Terms",
        oldValue: "30 days",
        newValue: "15 days",
        category: "FINANCIAL",
        severity: "HIGH",
      },
    ];

    const result = await explainStructuredChanges(changes, gateway);

    expect(result.status).toBe("UNAVAILABLE");
    expect(result.message).toBe(DEFAULT_AI_UNAVAILABLE_MSG);
    expect(result.retryable).toBe(true);
  });

  it("should return unavailable message on network timeout or fetch error", async () => {
    const gateway = new GroqGateway({ apiKey: "invalid_key", baseUrl: "http://localhost:9999" });

    const qaResult = await answerHistoryQuestion(
      "Which version changed payment terms?",
      [],
      [],
      [],
      gateway
    );

    expect(qaResult.status).toBe("UNAVAILABLE");
    expect(qaResult.message).toBe(DEFAULT_AI_UNAVAILABLE_MSG);
  });
});
