import type {
  ActivityEvent,
  AIExplanation,
  AIProposal,
  Collaborator,
  DocumentRecord } from
'../types';

export const documents: DocumentRecord[] = [
{
  id: 'vendor-agreement',
  title: 'Vendor Agreement — Northwind Supply',
  reference: 'VA-2291',
  role: 'Owner',
  branches: ['main', 'vendor-negotiation'],
  currentVersionId: 'v18',
  updatedAt: '2026-08-28T14:12:00Z',
  versionCount: 18,
  reviewNeeded: true,
  integrity: 'verified',
  versions: [
  {
    id: 'v15',
    label: 'V15',
    parentId: 'v14',
    branch: 'main',
    author: 'Meera Rao',
    timestamp: '2026-07-02T09:40:00Z',
    status: 'main',
    hash: '9f21c4a7e0b3d58c14ff7ab2cc90de41a7b6f0c3d92e18aa4b7c5d61e3f80a29',
    source: 'Uploaded revision',
    summary: 'Initial supply schedule agreed with vendor.',
    changes: []
  },
  {
    id: 'v16',
    label: 'V16',
    parentId: 'v15',
    branch: 'main',
    author: 'Akhand Pratap',
    timestamp: '2026-07-19T16:05:00Z',
    status: 'main',
    hash: '3b8e1d0a5c72f94b6ad3e8017cc45f2913ba6d0e7f48c1925ade63b0f7c18d54',
    source: 'Uploaded revision',
    summary: 'Delivery windows narrowed for Q3.',
    changes: [
    {
      id: 'c16-1',
      section: 'Delivery Window',
      previous: '10 business days',
      current: '7 business days',
      category: 'Operational',
      severity: 'medium',
      material: true,
      previousText:
      'Supplier shall deliver ordered goods within 10 business days of a confirmed purchase order.',
      currentText:
      'Supplier shall deliver ordered goods within 7 business days of a confirmed purchase order.'
    }]

  },
  {
    id: 'v17',
    label: 'V17',
    parentId: 'v16',
    branch: 'main',
    author: 'Akhand Pratap',
    timestamp: '2026-08-11T11:22:00Z',
    status: 'main',
    hash: 'c07d5f9b2e4a138c6f01ab7d43e92c58bd6f10a37e94c2b581da60f3c7e24b19',
    source: 'Uploaded revision',
    summary: 'Liability language restructured ahead of renewal.',
    changes: [
    {
      id: 'c17-1',
      section: 'Liability Cap',
      previous: 'USD 250,000',
      current: 'USD 400,000',
      category: 'Legal',
      severity: 'medium',
      material: true,
      previousText:
      'Aggregate liability of either party shall not exceed USD 250,000.',
      currentText:
      'Aggregate liability of either party shall not exceed USD 400,000.'
    }]

  },
  {
    id: 'v18',
    label: 'V18',
    parentId: 'v17',
    branch: 'main',
    author: 'Akhand Pratap',
    timestamp: '2026-08-28T14:12:00Z',
    status: 'current',
    hash: 'a41f7c920de53b8146ca07f2b9d31e6408cf75a2b3e19d0c85f46a7b2c910de3',
    source: 'Uploaded revision',
    summary: 'Payment window shortened; notice period extended.',
    changes: [
    {
      id: 'c18-1',
      section: 'Payment Terms',
      previous: '30 days',
      current: '15 days',
      category: 'Financial',
      severity: 'high',
      material: true,
      previousText:
      'Buyer shall settle all undisputed invoices within 30 days of receipt.',
      currentText:
      'Buyer shall settle all undisputed invoices within 15 days of receipt.'
    },
    {
      id: 'c18-2',
      section: 'Termination Notice',
      previous: '14 days',
      current: '30 days',
      category: 'Operational',
      severity: 'medium',
      material: true,
      previousText:
      'Either party may terminate this agreement with 14 days written notice.',
      currentText:
      'Either party may terminate this agreement with 30 days written notice.'
    },
    {
      id: 'c18-3',
      section: 'Definitions',
      previous: '"Goods" means the items listed in Schedule A.',
      current: '"Goods" means the items set out in Schedule A.',
      category: 'Editorial',
      severity: 'low',
      material: false,
      previousText: '"Goods" means the items listed in Schedule A.',
      currentText: '"Goods" means the items set out in Schedule A.'
    }]

  },
  {
    id: 'v18b',
    label: 'V18-b1',
    parentId: 'v17',
    branch: 'vendor-negotiation',
    author: 'Meera Rao',
    timestamp: '2026-08-26T10:02:00Z',
    status: 'branch',
    hash: 'd52b8e17f0c94a3b6d81ca07e2f34b9518ad6c07f3e91b2450af86c1d72e3b04',
    source: 'Branched from V17',
    summary: 'Alternative payment schedule explored with vendor.',
    changes: [
    {
      id: 'c18b-1',
      section: 'Payment Terms',
      previous: '30 days',
      current: '20 days',
      category: 'Financial',
      severity: 'medium',
      material: true,
      previousText:
      'Buyer shall settle all undisputed invoices within 30 days of receipt.',
      currentText:
      'Buyer shall settle all undisputed invoices within 20 days of receipt.'
    }]

  }]

},
{
  id: 'msa-orbital',
  title: 'Master Services Agreement — Orbital Labs',
  reference: 'MSA-1180',
  role: 'Editor',
  branches: ['main'],
  currentVersionId: 'm7',
  updatedAt: '2026-08-24T08:31:00Z',
  versionCount: 7,
  reviewNeeded: false,
  integrity: 'verified',
  versions: [
  {
    id: 'm6',
    label: 'V6',
    parentId: 'm5',
    branch: 'main',
    author: 'Sofia Lindqvist',
    timestamp: '2026-07-30T13:00:00Z',
    status: 'main',
    hash: 'b17e40c9d82a5f3b6104ce7fa29d3b8517cf60ae2b9d418c05fa73b6e2c19d08',
    source: 'Uploaded revision',
    summary: 'Support hours clarified.',
    changes: []
  },
  {
    id: 'm7',
    label: 'V7',
    parentId: 'm6',
    branch: 'main',
    author: 'Sofia Lindqvist',
    timestamp: '2026-08-24T08:31:00Z',
    status: 'current',
    hash: 'e93c1a06b7d24f85310cb7ea25d9f4b806ca17d3f92e5b408a1d76c3b0e254f7',
    source: 'Uploaded revision',
    summary: 'Service credits introduced for missed response targets.',
    changes: [
    {
      id: 'cm7-1',
      section: 'Service Credits',
      previous: 'Not defined',
      current: '5% of monthly fee per missed target',
      category: 'Financial',
      severity: 'medium',
      material: true,
      previousText:
      'No service credit mechanism was defined in this agreement.',
      currentText:
      'Provider shall issue a service credit of 5% of the monthly fee for each missed response target.'
    }]

  }]

},
{
  id: 'nda-halden',
  title: 'Mutual NDA — Halden Research',
  reference: 'NDA-0442',
  role: 'Viewer',
  branches: ['main'],
  currentVersionId: 'n3',
  updatedAt: '2026-08-12T17:45:00Z',
  versionCount: 3,
  reviewNeeded: false,
  integrity: 'verified',
  versions: [
  {
    id: 'n2',
    label: 'V2',
    parentId: 'n1',
    branch: 'main',
    author: 'Priya Nair',
    timestamp: '2026-06-18T09:10:00Z',
    status: 'main',
    hash: 'f0a24b8d61c95e37b8d40ca7f21e39b56c07da18e4f92b3c760ad51b8e2c34f9',
    source: 'Uploaded revision',
    summary: 'Confidentiality term aligned to policy.',
    changes: []
  },
  {
    id: 'n3',
    label: 'V3',
    parentId: 'n2',
    branch: 'main',
    author: 'Priya Nair',
    timestamp: '2026-08-12T17:45:00Z',
    status: 'current',
    hash: '27b9e04f1ac86d532f0b7ea94c1d38b607af52c9d81e36b4a0f7c25d9b3e10c8',
    source: 'Uploaded revision',
    summary: 'Survival clause extended by one year.',
    changes: [
    {
      id: 'cn3-1',
      section: 'Survival',
      previous: '2 years',
      current: '3 years',
      category: 'Legal',
      severity: 'low',
      material: false,
      previousText:
      'Confidentiality obligations survive for 2 years after termination.',
      currentText:
      'Confidentiality obligations survive for 3 years after termination.'
    }]

  }]

}];


export const aiExplanations: AIExplanation[] = [
{
  changeId: 'c18-1',
  question: 'Why does this matter?',
  body: 'The payment window is reduced by 50%. Invoices that previously fell due at 30 days will now fall due at 15, which may create an earlier cash obligation and affect existing reconciliation cycles.',
  basedOn: 'V17 → V18',
  agent: 'Document Review Agent',
  model: 'configured model',
  approval: 'pending'
},
{
  changeId: 'c18-2',
  question: 'Why does this matter?',
  body: 'Termination notice is extended from 14 to 30 days, lengthening the wind-down period for both parties.',
  basedOn: 'V17 → V18',
  agent: 'Document Review Agent',
  model: 'configured model',
  approval: 'approved'
},
{
  changeId: 'c18-3',
  question: 'Why does this matter?',
  body: 'This is a wording change with no detected effect on obligations.',
  basedOn: 'V17 → V18',
  agent: 'Document Review Agent',
  model: 'configured model',
  approval: 'approved'
}];


export const aiProposals: AIProposal[] = [
{
  id: 'p1',
  documentId: 'vendor-agreement',
  branch: 'vendor-negotiation',
  section: 'Payment Terms',
  proposed: 'Settle undisputed invoices within 20 days, with a 2% early settlement discount at 10 days.',
  rationale:
  'Proposed as a midpoint between the 30-day and 15-day positions recorded in version history.',
  approval: 'pending',
  createdAt: '2026-08-27T09:15:00Z'
}];


export const collaborators: Collaborator[] = [
{ id: 'u1', name: 'Akhand Pratap', email: 'akhand@versionvault.app', role: 'Owner' },
{ id: 'u2', name: 'Meera Rao', email: 'meera@versionvault.app', role: 'Editor' },
{ id: 'u3', name: 'Sofia Lindqvist', email: 'sofia@orbital-labs.com', role: 'Viewer' }];


export const activityEvents: ActivityEvent[] = [
{
  id: 'a1',
  type: 'VERSION_CREATED',
  actor: 'Akhand Pratap',
  timestamp: '2026-08-28T14:12:00Z',
  documentId: 'vendor-agreement',
  documentTitle: 'Vendor Agreement — Northwind Supply',
  branch: 'main',
  detail: 'V18 created from V17'
},
{
  id: 'a2',
  type: 'CHANGE_DETECTED',
  actor: 'System',
  timestamp: '2026-08-28T14:12:40Z',
  documentId: 'vendor-agreement',
  documentTitle: 'Vendor Agreement — Northwind Supply',
  branch: 'main',
  detail: 'Payment Terms 30 days → 15 days · Financial · HIGH'
},
{
  id: 'a3',
  type: 'AI_PROPOSAL_CREATED',
  actor: 'Document Review Agent',
  timestamp: '2026-08-27T09:15:00Z',
  documentId: 'vendor-agreement',
  documentTitle: 'Vendor Agreement — Northwind Supply',
  branch: 'vendor-negotiation',
  detail: 'Alternative payment schedule proposed — approval pending'
},
{
  id: 'a4',
  type: 'BRANCH_CREATED',
  actor: 'Meera Rao',
  timestamp: '2026-08-26T10:02:00Z',
  documentId: 'vendor-agreement',
  documentTitle: 'Vendor Agreement — Northwind Supply',
  branch: 'vendor-negotiation',
  detail: 'Branched from V17'
},
{
  id: 'a5',
  type: 'HUMAN_APPROVED',
  actor: 'Akhand Pratap',
  timestamp: '2026-08-25T15:38:00Z',
  documentId: 'msa-orbital',
  documentTitle: 'Master Services Agreement — Orbital Labs',
  branch: 'main',
  detail: 'Service credit interpretation approved'
},
{
  id: 'a6',
  type: 'VERSION_RESTORED',
  actor: 'Sofia Lindqvist',
  timestamp: '2026-08-24T08:31:00Z',
  documentId: 'msa-orbital',
  documentTitle: 'Master Services Agreement — Orbital Labs',
  branch: 'main',
  detail: 'V5 restored as new version V7'
},
{
  id: 'a7',
  type: 'PERMISSION_CHANGED',
  actor: 'Akhand Pratap',
  timestamp: '2026-08-20T12:04:00Z',
  documentId: 'nda-halden',
  documentTitle: 'Mutual NDA — Halden Research',
  branch: 'main',
  detail: 'Priya Nair set to Viewer'
},
{
  id: 'a8',
  type: 'DOCUMENT_DOWNLOADED',
  actor: 'Meera Rao',
  timestamp: '2026-08-18T18:20:00Z',
  documentId: 'nda-halden',
  documentTitle: 'Mutual NDA — Halden Research',
  branch: 'main',
  detail: 'V3 exported as PDF'
}];