import { StructuredChange, AIExplanationResult } from "../types/contracts.js";
import { OpenRouterGateway, DEFAULT_AI_UNAVAILABLE_MSG } from "./gateway.js";

/**
 * Generates an evidence-grounded AI explanation for structured document changes.
 * Never invents facts, timestamps, or hashes.
 * Degrades gracefully if AI is unavailable.
 */
export async function explainStructuredChanges(
  changes: StructuredChange[],
  gateway: OpenRouterGateway
): Promise<AIExplanationResult> {
  if (!changes || changes.length === 0) {
    return {
      status: "AVAILABLE",
      explanation: {
        summary: "No material changes detected between these versions.",
        businessImpact: "Document content remains unchanged.",
        riskAssessment: "Low / None",
        referencedChangeIds: [],
        confidence: 1.0,
      },
    };
  }

  // System prompt enforcing strict evidence grounding
  const systemPrompt = `You are VersionVault's document intelligence assistant.
Your sole job is to explain verified deterministic document changes provided as JSON evidence.
STRICT RULES:
1. Ground your explanation strictly in the provided StructuredChange items.
2. DO NOT invent old values, new values, actors, timestamps, or hashes.
3. Reference the change IDs provided.
4. Respond in strictly valid JSON format with keys: summary, businessImpact, riskAssessment, referencedChangeIds, confidence.`;

  // Filter and sanitize evidence to pass to LLM
  const evidencePayload = changes.map((c) => ({
    id: c.id,
    section: c.section,
    type: c.type,
    oldValue: c.oldValue,
    newValue: c.newValue,
    category: c.category,
    severity: c.severity,
  }));

  const userPrompt = `Explain these verified document changes:\n${JSON.stringify(
    evidencePayload,
    null,
    2
  )}`;

  const res = await gateway.generateCompletion(systemPrompt, userPrompt);

  if (!res.success || !res.content) {
    return {
      status: "UNAVAILABLE",
      message: DEFAULT_AI_UNAVAILABLE_MSG,
      retryable: true,
    };
  }

  try {
    // Clean code fences if AI returns markdown ```json ... ```
    const jsonMatch = res.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        status: "UNAVAILABLE",
        message: DEFAULT_AI_UNAVAILABLE_MSG,
        retryable: true,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      status: "AVAILABLE",
      explanation: {
        summary: parsed.summary || "Summary of changes computed.",
        businessImpact: parsed.businessImpact || "Business impact evaluated.",
        riskAssessment: parsed.riskAssessment || "Risk evaluated.",
        referencedChangeIds: Array.isArray(parsed.referencedChangeIds)
          ? parsed.referencedChangeIds
          : changes.map((c) => c.id),
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
      },
    };
  } catch (err) {
    return {
      status: "UNAVAILABLE",
      message: DEFAULT_AI_UNAVAILABLE_MSG,
      retryable: true,
    };
  }
}
