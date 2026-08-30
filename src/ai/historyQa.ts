import { Version, StructuredChange, ProvenanceRecord } from "../types/contracts";
import { OpenRouterGateway, DEFAULT_AI_UNAVAILABLE_MSG } from "./gateway";

export interface HistoryQAResult {
  status: "AVAILABLE" | "UNAVAILABLE";
  answer?: string;
  sourceVersionIds?: string[];
  referencedChangeIds?: string[];
  message?: string;
}

/**
 * Answers history questions grounded exclusively in authorized evidence.
 */
export async function answerHistoryQuestion(
  question: string,
  versions: Version[],
  structuredChanges: StructuredChange[],
  provenanceRecords: ProvenanceRecord[],
  gateway: OpenRouterGateway
): Promise<HistoryQAResult> {
  const systemPrompt = `You are VersionVault's document history assistant.
You answer user questions about document evolution using ONLY the authorized evidence provided below.
STRICT RULES:
1. Ground your answer exclusively in the provided version list, structured changes, and provenance records.
2. If the answer cannot be determined from the evidence, state that clearly.
3. DO NOT invent history, versions, actors, or dates.
4. Respond in JSON format: { answer: string, sourceVersionIds: string[], referencedChangeIds: string[] }`;

  const evidence = {
    versions: versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      createdBy: v.createdBy,
      createdAt: v.createdAt,
      message: v.message,
    })),
    structuredChanges: structuredChanges.map((c) => ({
      id: c.id,
      baseVersionId: c.baseVersionId,
      targetVersionId: c.targetVersionId,
      section: c.section,
      type: c.type,
      oldValue: c.oldValue,
      newValue: c.newValue,
      category: c.category,
      severity: c.severity,
    })),
  };

  const userPrompt = `Question: "${question}"\n\nAuthorized Evidence:\n${JSON.stringify(
    evidence,
    null,
    2
  )}`;

  const res = await gateway.generateCompletion(systemPrompt, userPrompt);

  if (!res.success || !res.content) {
    return {
      status: "UNAVAILABLE",
      message: DEFAULT_AI_UNAVAILABLE_MSG,
    };
  }

  try {
    const jsonMatch = res.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        status: "UNAVAILABLE",
        message: DEFAULT_AI_UNAVAILABLE_MSG,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      status: "AVAILABLE",
      answer: parsed.answer || "Answer derived from evidence.",
      sourceVersionIds: Array.isArray(parsed.sourceVersionIds) ? parsed.sourceVersionIds : [],
      referencedChangeIds: Array.isArray(parsed.referencedChangeIds) ? parsed.referencedChangeIds : [],
    };
    } catch {
    return {
      status: "UNAVAILABLE",
      message: DEFAULT_AI_UNAVAILABLE_MSG,
    };
  }
}
