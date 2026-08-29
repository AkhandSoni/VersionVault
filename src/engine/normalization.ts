import crypto from "crypto";

export interface ParsedSection {
  title: string;
  content: string;
  startLine: number;
  endLine: number;
  keyValuePairs?: Record<string, string>;
}

export interface NormalizedDocument {
  rawText: string;
  lines: string[];
  sections: ParsedSection[];
  contentHash: string;
}

/**
 * Normalizes document content deterministically.
 * - Standardizes line endings to \n
 * - Strips trailing whitespace per line
 * - Computes SHA-256 hex content hash
 * - Parses sections and key-value structures
 */
export function normalizeDocument(text: string): NormalizedDocument {
  // 1. Standardize line endings and trailing whitespace
  const rawText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const lines = rawText.split("\n").map((line) => line.trimEnd());
  const normalizedRaw = lines.join("\n");

  // 2. Compute SHA-256 hash deterministically
  const contentHash = crypto
    .createHash("sha256")
    .update(normalizedRaw, "utf8")
    .digest("hex");

  // 3. Extract sections (Key-Value clauses or Markdown Headers)
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection = {
    title: "General",
    content: "",
    startLine: 1,
    endLine: 1,
    keyValuePairs: {},
  };

  let sectionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check if header line (Markdown header like # or ##, or Clause Title ending with :)
    const headerMatch = line.match(/^#{1,6}\s+(.+)$/);
    const keyValueMatch = line.match(/^([A-Za-z0-9\s_\-]+):\s*(.+)$/);

    if (headerMatch) {
      if (sectionLines.length > 0) {
        currentSection.endLine = lineNumber - 1;
        currentSection.content = sectionLines.join("\n").trim();
        sections.push(currentSection);
      }
      currentSection = {
        title: headerMatch[1].trim(),
        content: "",
        startLine: lineNumber,
        endLine: lineNumber,
        keyValuePairs: {},
      };
      sectionLines = [];
    } else if (keyValueMatch) {
      const key = keyValueMatch[1].trim();
      const val = keyValueMatch[2].trim();
      currentSection.keyValuePairs![key] = val;
      sectionLines.push(line);
    } else {
      sectionLines.push(line);
    }
  }

  if (sectionLines.length > 0 || Object.keys(currentSection.keyValuePairs!).length > 0) {
    currentSection.endLine = lines.length;
    currentSection.content = sectionLines.join("\n").trim();
    sections.push(currentSection);
  }

  return {
    rawText: normalizedRaw,
    lines,
    sections,
    contentHash,
  };
}

/**
 * Computes deterministic SHA-256 hash for any string content
 */
export function computeSHA256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}
