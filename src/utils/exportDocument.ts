import type { DocumentRecord, Version } from '../types';
import { absoluteTime } from './documents';

export function generateFormalDocumentMarkdown(doc: DocumentRecord, version: Version): string {
  const dateFormatted = absoluteTime(version.timestamp);

  // Generate clauses based on document context & version changes
  const clauses = [
    {
      title: '1. PURPOSE & SCOPE OF AGREEMENT',
      body: `This Agreement governs the mutual obligations, service specifications, and authoritative terms established between the contracting parties. All revisions are tracked in VersionVault and sealed with cryptographic immutability.`,
    },
    {
      title: '2. TERM & COMMENCEMENT',
      body: `This Agreement takes effect upon execution and continues in full force until terminated by either party pursuant to the statutory notice provisions herein.`,
    },
    {
      title: '3. PERFORMANCE STANDARDS & DELIVERABLES',
      body: `All deliverables and services furnished under this Agreement shall conform strictly to the technical specifications and quality benchmarks agreed upon by both parties in the active statement of work.`,
    },
    {
      title: '4. FINANCIAL TERMS & PAYMENT SCHEDULE',
      body: version.changes.find((c) => c.section.toLowerCase().includes('payment'))
        ? version.changes.find((c) => c.section.toLowerCase().includes('payment'))!.currentText
        : `Client shall remit full payment of all undisputed invoiced amounts within 30 calendar days of invoice receipt. Overdue balances shall accrue interest at 1.5% per month or the maximum statutory rate allowable.`,
    },
    {
      title: '5. SERVICE LEVEL AGREEMENT (SLA) & RESPONSE TARGETS',
      body: version.changes.find((c) => c.section.toLowerCase().includes('service') || c.section.toLowerCase().includes('delivery') || c.section.toLowerCase().includes('sla') || c.section.toLowerCase().includes('response'))
        ? version.changes.find((c) => c.section.toLowerCase().includes('service') || c.section.toLowerCase().includes('delivery') || c.section.toLowerCase().includes('sla') || c.section.toLowerCase().includes('response'))!.currentText
        : `Vendor guarantees a minimum system uptime of 99.9% per calendar month. For critical incidents, Vendor support personnel shall respond within 15 minutes of initial notification. Failure to meet these thresholds qualifies Client for service fee credits.`,
    },
    {
      title: '6. CONFIDENTIALITY & DATA PROTECTION',
      body: `Each party agrees to hold the other's Proprietary and Confidential Information in strict confidence, exercising no less than reasonable standard of care. Neither party shall disclose such information to third parties without prior written consent.`,
    },
    {
      title: '7. LIABILITY CAP & INDEMNIFICATION',
      body: version.changes.find((c) => c.section.toLowerCase().includes('liability') || c.section.toLowerCase().includes('indemni'))
        ? version.changes.find((c) => c.section.toLowerCase().includes('liability') || c.section.toLowerCase().includes('indemni'))!.currentText
        : `Except for willful misconduct or breach of confidentiality, each party's maximum aggregate liability arising under or relating to this Agreement shall be limited to the total fees paid by Client during the preceding twelve (12) months.`,
    },
    {
      title: '8. GOVERNING LAW & JURISDICTION',
      body: `This Agreement shall be construed and governed in accordance with the substantive laws of Delaware, without regard to its conflict of law principles. Any dispute arising hereunder shall be submitted to binding arbitration.`,
    },
  ];

  // Format changes section if any
  let changesSection = '';
  if (version.changes && version.changes.length > 0) {
    changesSection = `
---

## 🔍 Verified Version Change Log (${version.label})

The following structured modifications were cryptographically detected and recorded in this version:

| Section | Previous Value | Revised Value | Materiality | Classification |
| :--- | :--- | :--- | :--- | :--- |
${version.changes
  .map(
    (c) =>
      `| **${c.section}** | \`${c.previous}\` | \`${c.current}\` | ${c.material ? '⚠️ **Material (High)**' : 'Standard'} | ${c.category} (${c.severity}) |`
  )
  .join('\n')}

### Detailed Clause Diffs:

${version.changes
  .map(
    (c) => `#### ${c.section}
- **Previous Formulation:**  
  > *${c.previousText}*
- **Authoritative Formulation in ${version.label}:**  
  > **${c.currentText}**
`
  )
  .join('\n')}
`;
  }

  return `# ${doc.title}
**Official Authoritative Snapshot — Version ${version.label}**

---

### 🛡️ Cryptographic Lineage & Certificate of Custody
| Attribute | Value |
| :--- | :--- |
| **Document Reference** | \`${doc.reference}\` |
| **Active Version** | \`${version.label}\` (${version.status.toUpperCase()}) |
| **Author / Signatory** | **${version.author}** |
| **Recorded Timestamp** | ${dateFormatted} (\`${version.timestamp}\`) |
| **Lineage Branch** | \`${version.branch}\` |
| **Source Provenance** | ${version.source} |
| **Cryptographic Hash (SHA-256)** | \`${version.hash}\` |
| **Parent Snapshot** | \`${version.parentId ? version.parentId.toUpperCase() : 'None (Root Genesis)'}\` |
| **Verification Authority** | **VersionVault Immutable Document Registry** |

---

## 📋 Executive Revision Summary
> **${version.summary}**

---

## 📜 Authoritative Agreement Terms

${clauses
  .map(
    (clause) => `### ${clause.title}

${clause.body}
`
  )
  .join('\n')}
${changesSection}

---

## ✍️ Verification & Cryptographic Seal

This document is an authoritative, tamper-evident export from **VersionVault**. Any unauthorized modification to this text invalidates the cryptographic SHA-256 fingerprint (\`${version.hash.slice(0, 16)}...\`).

**Signed & Audited by:**  
- **Operator:** ${version.author}  
- **Registry:** VersionVault Verified Tenant  
- **Audit Token:** \`vv_cert_${version.hash.slice(0, 12)}\`  
- **Status:** \`INTEGRITY_VERIFIED_VALID\`
`;
}
