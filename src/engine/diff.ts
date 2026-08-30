import { StructuredChange } from "../types/contracts";
import { normalizeDocument, computeSHA256 } from "./normalization";
import { classifyChange } from "./materiality";
import { diffLines } from "diff";

export interface ComputeDiffResult {
  baseVersionId: string;
  targetVersionId: string;
  baseContentHash: string;
  targetContentHash: string;
  changes: StructuredChange[];
  materialChangeCount: number;
  highSeverityCount: number;
}

/**
 * Computes deterministic structured changes between two document versions.
 * Completely deterministic and LLM-free.
 */
export function computeStructuredDiff(
  baseContent: string,
  targetContent: string,
  baseVersionId: string,
  targetVersionId: string
): ComputeDiffResult {
  const baseNorm = normalizeDocument(baseContent);
  const targetNorm = normalizeDocument(targetContent);

  const changes: StructuredChange[] = [];

  // Map key-value pairs from sections
  const baseKV: Record<string, { val: string; sectionTitle: string; line: number }> = {};
  const targetKV: Record<string, { val: string; sectionTitle: string; line: number }> = {};

  for (const s of baseNorm.sections) {
    if (s.keyValuePairs) {
      for (const [k, v] of Object.entries(s.keyValuePairs)) {
        baseKV[k] = { val: v, sectionTitle: s.title, line: s.startLine };
      }
    }
  }

  for (const s of targetNorm.sections) {
    if (s.keyValuePairs) {
      for (const [k, v] of Object.entries(s.keyValuePairs)) {
        targetKV[k] = { val: v, sectionTitle: s.title, line: s.startLine };
      }
    }
  }

  const processedKeys = new Set<string>();

  // 1. Process key-value modifications and removals
  for (const [key, baseItem] of Object.entries(baseKV)) {
    processedKeys.add(key);
    if (targetKV[key]) {
      const targetItem = targetKV[key];
      if (baseItem.val !== targetItem.val) {
        // Key-Value Modification
        const analysis = classifyChange(key, baseItem.val, targetItem.val, "MODIFIED");
        changes.push({
          id: generateChangeId(baseVersionId, targetVersionId, "MODIFIED", key, baseItem.val, targetItem.val),
          baseVersionId,
          targetVersionId,
          type: "MODIFIED",
          section: key,
          oldValue: baseItem.val,
          newValue: targetItem.val,
          category: analysis.category,
          severity: analysis.severity,
          confidence: analysis.confidence,
          location: {
            lineStart: targetItem.line,
            lineEnd: targetItem.line,
          },
        });
      }
    } else {
      // Key-Value Removal
      const analysis = classifyChange(key, baseItem.val, undefined, "REMOVED");
      changes.push({
        id: generateChangeId(baseVersionId, targetVersionId, "REMOVED", key, baseItem.val, ""),
        baseVersionId,
        targetVersionId,
        type: "REMOVED",
        section: key,
        oldValue: baseItem.val,
        newValue: undefined,
        category: analysis.category,
        severity: analysis.severity,
        confidence: analysis.confidence,
        location: {
          lineStart: baseItem.line,
          lineEnd: baseItem.line,
        },
      });
    }
  }

  // 2. Process key-value additions
  for (const [key, targetItem] of Object.entries(targetKV)) {
    if (!processedKeys.has(key)) {
      const analysis = classifyChange(key, undefined, targetItem.val, "ADDED");
      changes.push({
        id: generateChangeId(baseVersionId, targetVersionId, "ADDED", key, "", targetItem.val),
        baseVersionId,
        targetVersionId,
        type: "ADDED",
        section: key,
        oldValue: undefined,
        newValue: targetItem.val,
        category: analysis.category,
        severity: analysis.severity,
        confidence: analysis.confidence,
        location: {
          lineStart: targetItem.line,
          lineEnd: targetItem.line,
        },
      });
    }
  }

  // 3. Process line-level diffs for unstructured text
  const lineDiffs = diffLines(baseNorm.rawText, targetNorm.rawText);
  let currentBaseLine = 1;
  let currentTargetLine = 1;

  for (const changeChunk of lineDiffs) {
    const chunkLines = (changeChunk.value || "").split("\n").filter((l) => l.trim() !== "");
    const lineCount = chunkLines.length;

    if (changeChunk.added) {
      for (const lineText of chunkLines) {
        // Skip if this line is already captured as a Key-Value pair
        const isKV = Object.keys(targetKV).some((k) => lineText.startsWith(k + ":"));
        if (!isKV && lineText.trim().length > 0) {
          const analysis = classifyChange("Document Body", undefined, lineText, "ADDED");
          changes.push({
            id: generateChangeId(baseVersionId, targetVersionId, "ADDED", "Document Body", "", lineText),
            baseVersionId,
            targetVersionId,
            type: "ADDED",
            section: "Document Body",
            oldValue: undefined,
            newValue: lineText,
            category: analysis.category,
            severity: analysis.severity,
            confidence: analysis.confidence,
            location: {
              lineStart: currentTargetLine,
              lineEnd: currentTargetLine,
            },
          });
        }
      }
      currentTargetLine += lineCount;
    } else if (changeChunk.removed) {
      for (const lineText of chunkLines) {
        const isKV = Object.keys(baseKV).some((k) => lineText.startsWith(k + ":"));
        if (!isKV && lineText.trim().length > 0) {
          const analysis = classifyChange("Document Body", lineText, undefined, "REMOVED");
          changes.push({
            id: generateChangeId(baseVersionId, targetVersionId, "REMOVED", "Document Body", lineText, ""),
            baseVersionId,
            targetVersionId,
            type: "REMOVED",
            section: "Document Body",
            oldValue: lineText,
            newValue: undefined,
            category: analysis.category,
            severity: analysis.severity,
            confidence: analysis.confidence,
            location: {
              lineStart: currentBaseLine,
              lineEnd: currentBaseLine,
            },
          });
        }
      }
      currentBaseLine += lineCount;
    } else {
      currentBaseLine += lineCount;
      currentTargetLine += lineCount;
    }
  }

  const materialChangeCount = changes.filter(
    (c) => c.category !== "CONTENT" && c.category !== "GENERAL"
  ).length;
  const highSeverityCount = changes.filter((c) => c.severity === "HIGH").length;

  return {
    baseVersionId,
    targetVersionId,
    baseContentHash: baseNorm.contentHash,
    targetContentHash: targetNorm.contentHash,
    changes,
    materialChangeCount,
    highSeverityCount,
  };
}

/**
 * Deterministically derives a unique Change ID
 */
function generateChangeId(
  baseVersionId: string,
  targetVersionId: string,
  type: string,
  section: string,
  oldVal?: string,
  newVal?: string
): string {
  const composite = `${baseVersionId}:${targetVersionId}:${type}:${section}:${oldVal || ""}:${newVal || ""}`;
  return "chg_" + computeSHA256(composite).substring(0, 16);
}
