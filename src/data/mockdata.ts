export const documents = [
  {
    id: "1",
    name: "Vendor Agreement",
    version: "V2",
    status: "Verified",
    branch: "main",
    owner: "Akhand",
    updatedAt: "Aug 28, 2026",
  },
  {
    id: "2",
    name: "Employment Contract",
    version: "V3",
    status: "Verified",
    branch: "main",
    owner: "Akhand",
    updatedAt: "Aug 27, 2026",
  },
  {
    id: "3",
    name: "Service Agreement",
    version: "V1",
    status: "Pending",
    branch: "legal-review",
    owner: "Akhand",
    updatedAt: "Aug 26, 2026",
  },
];

export const activities = [
  {
    id: "1",
    action: "VERSION_CREATED",
    document: "Vendor Agreement",
    user: "Akhand",
    time: "2 hours ago",
  },
  {
    id: "2",
    action: "DOCUMENT_UPDATED",
    document: "Employment Contract",
    user: "Akhand",
    time: "Yesterday",
  },
  {
    id: "3",
    action: "BRANCH_CREATED",
    document: "Service Agreement",
    user: "Akhand",
    time: "2 days ago",
  },
];

export const branches = [
  {
    id: "1",
    name: "main",
    description: "Primary document history",
    version: "V2",
    updatedAt: "Aug 28, 2026",
  },
  {
    id: "2",
    name: "legal-review",
    description: "Changes prepared for legal review",
    version: "V4",
    updatedAt: "Aug 28, 2026",
  },
  {
    id: "3",
    name: "client-edits",
    description: "Client requested modifications",
    version: "V3",
    updatedAt: "Aug 27, 2026",
  },
];

export const versions = [
  {
    id: "v2",
    version: "V2",
    documentId: "1",
    createdBy: "Akhand",
    createdAt: "Aug 28, 2026",
    status: "Current",
  },
  {
    id: "v1",
    version: "V1",
    documentId: "1",
    createdBy: "Akhand",
    createdAt: "Aug 27, 2026",
    status: "Previous",
  },
];

/* =========================================================
   VERSION COMPARISON
========================================================= */

export const versionComparison = {
  documentId: "1",

  documentName: "Vendor Agreement",

  company: "Acme Technologies",

  baseVersion: {
    version: "V1",
    date: "Aug 27, 2026",
  },

  targetVersion: {
    version: "V2",
    date: "Aug 28, 2026",
  },

  materialChanges: 2,

  changes: [
    {
      id: "payment",
      section: "PAYMENT TERMS",
      oldValue: "30 days",
      newValue: "15 days",
      category: "FINANCIAL",
      severity: "HIGH",
    },
    {
      id: "liability",
      section: "LIABILITY CAP",
      oldValue: "₹50,000",
      newValue: "₹1,00,000",
      category: "FINANCIAL",
      severity: "HIGH",
    },
  ],

  previousContent: [
    {
      title: "Payment Terms",
      value: "30 days",
      changed: true,
    },
    {
      title: "Liability Cap",
      value: "₹50,000",
      changed: true,
    },
    {
      title: "Termination Notice",
      value: "30 days",
      changed: false,
    },
    {
      title: "Support",
      value: "Business hours",
      changed: false,
    },
  ],

  currentContent: [
    {
      title: "Payment Terms",
      value: "15 days",
      changed: true,
    },
    {
      title: "Liability Cap",
      value: "₹1,00,000",
      changed: true,
    },
    {
      title: "Termination Notice",
      value: "30 days",
      changed: false,
    },
    {
      title: "Support",
      value: "Business hours",
      changed: false,
    },
  ],

  evidence: [
    {
      label: "SOURCE VERSIONS",
      value: "V1 → V2",
    },
    {
      label: "SECTION",
      value: "Payment Terms",
    },
    {
      label: "PREVIOUS VALUE",
      value: "30 days",
    },
    {
      label: "CURRENT VALUE",
      value: "15 days",
    },
    {
      label: "ACTOR",
      value: "Akhand",
    },
    {
      label: "TIMESTAMP",
      value: "Aug 28, 2026 · 03:42 PM",
    },
    {
      label: "BRANCH",
      value: "main",
    },
    {
      label: "SOURCE",
      value: "Uploaded revision",
    },
    {
      label: "INTEGRITY",
      value: "SHA-256 VERIFIED",
    },
  ],

  provenance: [
    {
      label: "ORIGIN",
      value: "V1",
    },
    {
      label: "ACTOR",
      value: "Akhand",
    },
    {
      label: "BRANCH",
      value: "main",
    },
    {
      label: "TIMESTAMP",
      value: "Aug 28, 2026",
    },
    {
      label: "SOURCE",
      value: "Uploaded revision",
    },
    {
      label: "ARTIFACT",
      value: "Vendor Agreement",
    },
    {
      label: "TARGET",
      value: "V2",
    },
    {
      label: "HASH",
      value: "SHA-256 verified",
    },
  ],

  ai: {
    status: "AVAILABLE",

    explanation:
      "The payment window was reduced from 30 days to 15 days. This may increase the speed at which payment is expected and could affect cash-flow planning.",

    affected: [
      "Payment scheduling",
      "Accounts payable workflow",
      "Cash-flow planning",
    ],

    basedOn: "V1 → V2 · Payment Terms",
  },
};