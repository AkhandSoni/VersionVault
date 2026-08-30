// ============================================================
// VersionVault — Upload / Processing Limits
// Enforce these server-side. See SECURITY.md §14.
// ============================================================

export const UPLOAD_LIMITS = {
  /** Maximum raw upload size in bytes (50 MB) */
  MAX_UPLOAD_BYTES: 50 * 1024 * 1024,

  /** Maximum extracted text size in bytes (10 MB) */
  MAX_EXTRACTED_BYTES: 10 * 1024 * 1024,

  /** Maximum pages to process per document */
  MAX_PAGES: 500,

  /** Maximum objects stored per document */
  MAX_OBJECTS_PER_DOCUMENT: 100,

  /** Maximum files inside an archive */
  MAX_ARCHIVE_FILES: 50,

  /** Maximum expansion ratio for archives (compressed → uncompressed) */
  MAX_ARCHIVE_EXPANSION: 10,

  /** Maximum nesting depth for archive entry paths */
  MAX_ARCHIVE_NESTING: 5,

  /** Maximum processing time in milliseconds (5 minutes) */
  MAX_PROCESSING_TIME_MS: 5 * 60 * 1000,

  /** Maximum extracted document text size in bytes (5 MB) */
  MAX_DOCUMENT_TEXT_SIZE: 5 * 1024 * 1024,
} as const;

// ----------------------------------------------------------------
// Accepted MIME types
// ----------------------------------------------------------------
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/vnd.oasis.opendocument.text', // .odt
  'application/vnd.oasis.opendocument.presentation', // .odp
  'application/vnd.oasis.opendocument.spreadsheet', // .ods
  'application/rtf', // .rtf
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/tab-separated-values',
  'application/json',
  'application/xml',
  'text/html',
] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

// ----------------------------------------------------------------
// Storage
// ----------------------------------------------------------------
export const STORAGE_BUCKET = 'documents'; // private Supabase bucket name
export const SIGNED_URL_EXPIRY_SECONDS = 60; // short-lived signed URL (1 min)

// ----------------------------------------------------------------
// Pagination
// ----------------------------------------------------------------
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ----------------------------------------------------------------
// API
// ----------------------------------------------------------------
export const API_PREFIX = '/api/v1';
