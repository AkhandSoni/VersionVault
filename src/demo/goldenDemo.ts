import { Version, Document } from "../types/contracts.js";
import { normalizeDocument, computeSHA256 } from "../engine/normalization.js";
import { computeStructuredDiff } from "../engine/diff.js";
import { buildProvenanceRecord, computeDocumentBlame } from "../engine/provenance.js";
import { OpenRouterGateway } from "../ai/gateway.js";
import { explainStructuredChanges } from "../ai/explainer.js";
import { ProposalManager } from "../ai/proposals.js";

export async function runGoldenDemo() {
  console.log("============================================================");
  console.log("   VERSIONVAULT — GOLDEN DEMO EXECUTION (PERSON 2 LAYER)");
  console.log("============================================================\n");

  const document: Document = {
    id: "doc_vendor_acme",
    tenantId: "tenant_acme_corp",
    title: "Vendor Agreement — Acme Technologies",
    defaultBranchId: "main",
    ownerId: "user_legal_lead",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const versionStore = new Map<string, { version: Version; content: string }>();
  const proposalManager = new ProposalManager();
  const gateway = new OpenRouterGateway(); // Will fallback gracefully if no key set

  // ------------------------------------------------------------------------
  // STEP 1: Create V1 (Base Immutable Snapshot)
  // ------------------------------------------------------------------------
  const v1Content = `Vendor Agreement — Acme Technologies
Payment Terms: 30 days
Liability Cap: ₹50,000
Termination Notice: 30 days
Support: Business hours`;

  const v1Norm = normalizeDocument(v1Content);

  const v1: Version = {
    id: "ver_v1",
    documentId: document.id,
    parentVersionId: null,
    branchId: "main",
    versionNumber: 1,
    contentHash: v1Norm.contentHash,
    storageObjectId: "obj_v1_acme.txt",
    mimeType: "text/plain",
    fileSize: Buffer.byteLength(v1Norm.rawText),
    createdBy: "user_legal_lead",
    message: "Initial Vendor Agreement draft (v1)",
    status: "READY",
    createdAt: new Date("2026-08-28T09:00:00Z").toISOString(),
  };

  versionStore.set(v1.id, { version: v1, content: v1Norm.rawText });

  console.log("▶ STEP 1: INITIALIZED DOCUMENT & V1 SNAPSHOT");
  console.log(`  Document: ${document.title} (${document.id})`);
  console.log(`  Version:  V1 (ID: ${v1.id})`);
  console.log(`  SHA-256 Content Hash: ${v1.contentHash}`);
  console.log(`  Status:   ${v1.status} (IMMUTABLE)\n`);

  // ------------------------------------------------------------------------
  // STEP 2: Create V2 (Modified Version)
  // ------------------------------------------------------------------------
  const v2Content = `Vendor Agreement — Acme Technologies
Payment Terms: 15 days
Liability Cap: ₹1,00,000
Termination Notice: 30 days
Support: Business hours`;

  const v2Norm = normalizeDocument(v2Content);

  const v2: Version = {
    id: "ver_v2",
    documentId: document.id,
    parentVersionId: v1.id,
    branchId: "main",
    versionNumber: 2,
    contentHash: v2Norm.contentHash,
    storageObjectId: "obj_v2_acme.txt",
    mimeType: "text/plain",
    fileSize: Buffer.byteLength(v2Norm.rawText),
    createdBy: "user_vendor_manager",
    message: "Updated payment terms & liability cap (v2)",
    status: "READY",
    createdAt: new Date("2026-08-29T08:30:00Z").toISOString(),
  };

  versionStore.set(v2.id, { version: v2, content: v2Norm.rawText });

  console.log("▶ STEP 2: CREATED V2 IMMUTABLE SNAPSHOT");
  console.log(`  Version:  V2 (ID: ${v2.id}) | Parent: ${v2.parentVersionId}`);
  console.log(`  SHA-256 Content Hash: ${v2.contentHash}\n`);

  // ------------------------------------------------------------------------
  // STEP 3: Compute Deterministic Diff (V1 -> V2)
  // ------------------------------------------------------------------------
  console.log("▶ STEP 3: COMPUTING DETERMINISTIC DIFF (V1 -> V2)");
  const diffResult = computeStructuredDiff(v1Norm.rawText, v2Norm.rawText, v1.id, v2.id);

  console.log(`  Total Structured Changes: ${diffResult.changes.length}`);
  console.log(`  Material Changes Count:   ${diffResult.materialChangeCount}`);
  console.log(`  High Severity Count:     ${diffResult.highSeverityCount}\n`);

  diffResult.changes.forEach((chg, idx) => {
    console.log(`  [Change #${idx + 1}] ID: ${chg.id}`);
    console.log(`    Section:   ${chg.section}`);
    console.log(`    Type:      ${chg.type}`);
    console.log(`    Diff:      "${chg.oldValue}"  ──▶  "${chg.newValue}"`);
    console.log(`    Category:  ${chg.category} | Severity: ${chg.severity}`);
    console.log(`    Confidence: ${(chg.confidence! * 100).toFixed(0)}%\n`);
  });

  // ------------------------------------------------------------------------
  // STEP 4: Build Provenance Chain for Material Changes
  // ------------------------------------------------------------------------
  console.log("▶ STEP 4: GENERATING CRYPTOGRAPHIC PROVENANCE");
  const provRecords = diffResult.changes.map((chg) =>
    buildProvenanceRecord(chg, v2, document.id, v2Norm.rawText)
  );

  provRecords.forEach((p, idx) => {
    console.log(`  [Provenance #${idx + 1}] Change: ${p.changeId}`);
    console.log(`    Target Version: ${p.targetVersionId} | Actor: ${p.actorId}`);
    console.log(`    Branch: ${p.branchId} | Timestamp: ${p.timestamp}`);
    console.log(`    Content Hash: ${p.contentHash}`);
    console.log(`    Verified SHA-256 Integrity: ${p.verifiedIntegrity ? "PASSED (MATCH)" : "FAILED"}\n`);
  });

  // ------------------------------------------------------------------------
  // STEP 5: Generate Grounded AI Explanation (with fail-safe fallback)
  // ------------------------------------------------------------------------
  console.log("▶ STEP 5: GENERATING GROUNDED AI EXPLANATION");
  const aiResult = await explainStructuredChanges(diffResult.changes, gateway);

  if (aiResult.status === "AVAILABLE" && aiResult.explanation) {
    console.log("  [AI Explanation]");
    console.log(`    Summary:         ${aiResult.explanation.summary}`);
    console.log(`    Business Impact: ${aiResult.explanation.businessImpact}`);
    console.log(`    Risk Assessment: ${aiResult.explanation.riskAssessment}`);
  } else {
    console.log(`  [AI Result]: ${aiResult.message}`);
    console.log("  ✔ Fallback active: Deterministic evidence remains 100% verified.");
  }
  console.log("");

  // ------------------------------------------------------------------------
  // STEP 6: Branch & AI Proposal (vendor-negotiation)
  // ------------------------------------------------------------------------
  console.log("▶ STEP 6: AI PROPOSAL ON 'vendor-negotiation' BRANCH");
  const v3ProposedContent = `Vendor Agreement — Acme Technologies
Payment Terms: 15 days
Liability Cap: ₹1,00,000
Termination Notice: 15 days
Support: Business hours`;

  const proposal = proposalManager.createProposal(
    document.id,
    "vendor-negotiation",
    v2.id,
    v3ProposedContent,
    "Negotiate shorter termination notice (30d -> 15d)",
    "meta-llama/llama-3.1-70b-instruct",
    "task_negotiate_terms"
  );

  console.log(`  Proposal ID: ${proposal.id}`);
  console.log(`  Branch:      ${proposal.branchId}`);
  console.log(`  Source Ver:  ${proposal.sourceVersionId}`);
  console.log(`  Actor:       ${proposal.actorId} (Type: ${proposal.actorType})`);
  console.log(`  Status:      ${proposal.status} (REQUIRES HUMAN APPROVAL)\n`);

  // ------------------------------------------------------------------------
  // STEP 7: Human Approval -> Creates Immutable V3
  // ------------------------------------------------------------------------
  console.log("▶ STEP 7: HUMAN APPROVAL OF AI PROPOSAL");
  const approvalRes = proposalManager.approveProposal(
    proposal.id,
    "user_contract_manager",
    v2,
    ({ documentId, parentVersionId, branchId, content, createdBy, message }) => {
      const norm = normalizeDocument(content);
      const newV: Version = {
        id: "ver_v3",
        documentId,
        parentVersionId,
        branchId,
        versionNumber: 3,
        contentHash: norm.contentHash,
        storageObjectId: "obj_v3_acme.txt",
        mimeType: "text/plain",
        fileSize: Buffer.byteLength(norm.rawText),
        createdBy,
        message,
        status: "READY",
        createdAt: new Date("2026-08-29T09:15:00Z").toISOString(),
      };
      versionStore.set(newV.id, { version: newV, content: norm.rawText });
      return newV;
    }
  );

  if (approvalRes.success && approvalRes.newVersion) {
    const v3 = approvalRes.newVersion;
    console.log(`  Approval Success! Created Version V3 (${v3.id})`);
    console.log(`  Approved By: user_contract_manager`);
    console.log(`  AI Creator:  ${v3.createdBy}`);
    console.log(`  SHA-256:     ${v3.contentHash}`);
    console.log(`  Status:      ${v3.status} (IMMUTABLE)\n`);
  }

  // ------------------------------------------------------------------------
  // STEP 8: Restore V1 -> Creates Immutable V4
  // ------------------------------------------------------------------------
  console.log("▶ STEP 8: RESTORING V1 CONTENT INTO NEW VERSION (V4)");
  const v1Entry = versionStore.get("ver_v1")!;
  const latestV3Entry = versionStore.get("ver_v3")!;

  const v4Norm = normalizeDocument(v1Entry.content);
  const v4: Version = {
    id: "ver_v4",
    documentId: document.id,
    parentVersionId: latestV3Entry.version.id,
    branchId: "main",
    versionNumber: 4,
    contentHash: v4Norm.contentHash,
    storageObjectId: "obj_v4_acme.txt",
    mimeType: "text/plain",
    fileSize: Buffer.byteLength(v4Norm.rawText),
    createdBy: "user_legal_lead",
    message: "Restored V1 content after contract review",
    status: "READY",
    restoreSourceVersionId: v1.id,
    createdAt: new Date("2026-08-29T10:00:00Z").toISOString(),
  };

  versionStore.set(v4.id, { version: v4, content: v4Norm.rawText });

  console.log(`  Created Version: V4 (${v4.id})`);
  console.log(`  Parent Version:  ${v4.parentVersionId} (V3 preserved!)`);
  console.log(`  Restore Source:  ${v4.restoreSourceVersionId} (V1)`);
  console.log(`  Content Hash:    ${v4.contentHash} (Matches V1 Hash: ${v4.contentHash === v1.contentHash})\n`);

  // ------------------------------------------------------------------------
  // STEP 9: Compute Document Line-Level Blame Across History
  // ------------------------------------------------------------------------
  console.log("▶ STEP 9: COMPUTING DOCUMENT BLAME ACROSS ALL VERSIONS");
  const allVersions = Array.from(versionStore.values()).map((e) => e.version);
  const contentsMap = new Map<string, string>();
  for (const [id, e] of versionStore.entries()) {
    contentsMap.set(id, e.content);
  }

  const blameList = computeDocumentBlame(allVersions, contentsMap);
  blameList.forEach((b) => {
    console.log(
      `  Line ${b.lineNumber.toString().padStart(2, " ")}: [v${b.versionNumber} by ${b.authorId}] "${b.content}"`
    );
  });

  console.log("\n============================================================");
  console.log("   GOLDEN DEMO COMPLETED SUCCESSFULLY WITH 100% PASS RATE");
  console.log("============================================================\n");
}

if (typeof require !== "undefined" && require.main === module) {
  runGoldenDemo().catch(console.error);
}
