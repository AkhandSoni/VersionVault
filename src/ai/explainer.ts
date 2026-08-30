import { StructuredChange, AIExplanationResult } from "../types/contracts";
import { GroqGateway, DEFAULT_AI_UNAVAILABLE_MSG } from "./gateway";
import { z } from "zod";

/**
 * Generates an evidence-grounded AI explanation for structured document changes.
 * Never invents facts, timestamps, or hashes.
 * Degrades gracefully if AI is unavailable.
 */
export async function explainStructuredChanges(
  changes: StructuredChange[],
  gateway: GroqGateway
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

    const parsedResult = z.object({
      summary: z.string().min(1).max(4000),
      businessImpact: z.string().min(1).max(4000),
      riskAssessment: z.string().min(1).max(4000),
      referencedChangeIds: z.array(z.string()).max(500).default([]),
      confidence: z.number().min(0).max(1),
    }).safeParse(JSON.parse(jsonMatch[0]));
    if (!parsedResult.success) {
      return {
        status: "UNAVAILABLE",
        message: DEFAULT_AI_UNAVAILABLE_MSG,
        retryable: true,
      };
    }

    const parsed = parsedResult.data;
    const changeIds = new Set(changes.map((change) => change.id));

    return {
      status: "AVAILABLE",
      explanation: {
        summary: parsed.summary || "Summary of changes computed.",
        businessImpact: parsed.businessImpact || "Business impact evaluated.",
        riskAssessment: parsed.riskAssessment || "Risk evaluated.",
        referencedChangeIds: parsed.referencedChangeIds.filter((id) => changeIds.has(id)),
        confidence: parsed.confidence,
      },
    };
    } catch {
    return {
      status: "UNAVAILABLE",
      message: DEFAULT_AI_UNAVAILABLE_MSG,
      retryable: true,
    };
  }
}
