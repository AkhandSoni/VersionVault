import {
  MaterialityCategory,
  SeverityLevel,
  ChangeType,
} from "../types/contracts.js";

export interface MaterialityAnalysis {
  category: MaterialityCategory;
  severity: SeverityLevel;
  confidence: number;
}

/**
 * Deterministically classifies a change by category and severity.
 * 100% rule-based and reproducible. Zero LLM requirement.
 */
export function classifyChange(
  section: string | undefined,
  oldValue: string | undefined,
  newValue: string | undefined,
  changeType: ChangeType
): MaterialityAnalysis {
  const sectionText = (section || "").toLowerCase();
  const oldText = (oldValue || "").toLowerCase();
  const newText = (newValue || "").toLowerCase();
  const combinedText = `${sectionText} ${oldText} ${newText}`;

  // 1. Financial rules
  const isFinancialSection =
    sectionText.includes("payment") ||
    sectionText.includes("liability") ||
    sectionText.includes("price") ||
    sectionText.includes("cost") ||
    sectionText.includes("fee") ||
    sectionText.includes("penalty") ||
    sectionText.includes("financial") ||
    sectionText.includes("rate");

  const hasCurrencySymbol = /[₹$€£¥]|\b(inr|usd|eur|gbp)\b/i.test(combinedText);
  const hasPaymentTerms = /\b\d+\s*days?\b/i.test(combinedText) && (sectionText.includes("payment") || oldText.includes("payment") || newText.includes("payment"));

  if (isFinancialSection || hasCurrencySymbol || hasPaymentTerms) {
    let severity: SeverityLevel = "MEDIUM";

    // High severity triggers
    if (
      (sectionText.includes("liability") && hasCurrencySymbol) ||
      (sectionText.includes("payment") && /\b(15|30|60|90)\s*days?\b/i.test(combinedText)) ||
      hasSubstantialNumericChange(oldText, newText)
    ) {
      severity = "HIGH";
    }

    return {
      category: "FINANCIAL",
      severity,
      confidence: 0.95,
    };
  }

  // 2. Contractual rules
  const isContractualSection =
    sectionText.includes("termination") ||
    sectionText.includes("indemnification") ||
    sectionText.includes("dispute") ||
    sectionText.includes("governing law") ||
    sectionText.includes("confidentiality") ||
    sectionText.includes("warranty") ||
    sectionText.includes("breach") ||
    sectionText.includes("contract");

  if (isContractualSection) {
    let severity: SeverityLevel = "MEDIUM";

    if (
      sectionText.includes("termination") ||
      sectionText.includes("indemnification") ||
      changeType === "REMOVED"
    ) {
      severity = "HIGH";
    }

    return {
      category: "CONTRACTUAL",
      severity,
      confidence: 0.92,
    };
  }

  // 3. Operational rules
  const isOperationalSection =
    sectionText.includes("support") ||
    sectionText.includes("sla") ||
    sectionText.includes("maintenance") ||
    sectionText.includes("delivery") ||
    sectionText.includes("uptime") ||
    sectionText.includes("hours");

  if (isOperationalSection) {
    let severity: SeverityLevel = "LOW";
    if (combinedText.includes("24/7") || combinedText.includes("business hours") || combinedText.includes("downtime")) {
      severity = "MEDIUM";
    }
    return {
      category: "OPERATIONAL",
      severity,
      confidence: 0.88,
    };
  }

  // 4. Technical rules
  const isTechnicalSection =
    sectionText.includes("api") ||
    sectionText.includes("system") ||
    sectionText.includes("security") ||
    sectionText.includes("version") ||
    sectionText.includes("server") ||
    sectionText.includes("database");

  if (isTechnicalSection) {
    return {
      category: "TECHNICAL",
      severity: "MEDIUM",
      confidence: 0.85,
    };
  }

  // 5. Default content classification
  return {
    category: "CONTENT",
    severity: changeType === "MODIFIED" ? "LOW" : "MEDIUM",
    confidence: 0.8,
  };
}

/**
 * Checks if numeric change ratio is significant (>= 50% shift or high value)
 */
function hasSubstantialNumericChange(oldStr: string, newStr: string): boolean {
  const oldNums = (oldStr.match(/\d+([.,]\d+)?/g) || []).map((n) => parseFloat(n.replace(/,/g, "")));
  const newNums = (newStr.match(/\d+([.,]\d+)?/g) || []).map((n) => parseFloat(n.replace(/,/g, "")));

  if (oldNums.length > 0 && newNums.length > 0) {
    const oldVal = oldNums[0];
    const newVal = newNums[0];
    if (oldVal > 0) {
      const ratio = Math.abs(newVal - oldVal) / oldVal;
      if (ratio >= 0.3) return true; // >= 30% shift
    }
  }
  return false;
}
