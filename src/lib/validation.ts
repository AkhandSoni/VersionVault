// ============================================================
// VersionVault — Request Validation Helpers
// Server-side only. See SECURITY.md §13.
// ============================================================

import { UPLOAD_LIMITS, ACCEPTED_MIME_TYPES, MAX_PAGE_SIZE, type AcceptedMimeType } from './constants';
import { ValidationError, UploadError } from './errors';

const MIME_EXTENSIONS: Record<AcceptedMimeType, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'application/vnd.oasis.opendocument.presentation': ['.odp'],
  'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
  'application/rtf': ['.rtf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md', '.markdown'],
  'text/csv': ['.csv'],
  'text/tab-separated-values': ['.tsv'],
  'application/json': ['.json'],
  'application/xml': ['.xml'],
  'text/html': ['.html', '.htm'],
};

/** Browser File.type is frequently empty or octet-stream for Office files. */
export function inferMimeType(filename: string, declaredMimeType?: string): string {
  const lowerName = filename.toLowerCase();
  const match = (Object.entries(MIME_EXTENSIONS) as [AcceptedMimeType, string[]][])
    .find(([, extensions]) => extensions.some((extension) => lowerName.endsWith(extension)));
  if (match && (!declaredMimeType || declaredMimeType === 'application/octet-stream' ||
      !MIME_EXTENSIONS[declaredMimeType as AcceptedMimeType]?.some((extension) => lowerName.endsWith(extension)))) {
    return match[0];
  }
  if (declaredMimeType && isValidMimeType(declaredMimeType)) {
    return declaredMimeType;
  }
  return match?.[0] ?? 'application/octet-stream';
}

const ZIP_MIME_TYPES = new Set<AcceptedMimeType>([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.spreadsheet',
]);

const OLE_MIME_TYPES = new Set<AcceptedMimeType>([
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.ms-excel',
]);

/**
 * Validate an uploaded file buffer.
 * Checks size and MIME type (caller must also verify magic bytes
 * per SECURITY.md §13 before storing).
 */
export function validateUpload(
  buffer: Buffer,
  declaredMimeType: string,
  filename?: string,
): void {
  if (buffer.byteLength === 0) {
    throw new UploadError('Uploaded file cannot be empty');
  }

  if (buffer.byteLength > UPLOAD_LIMITS.MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `File exceeds maximum size of ${UPLOAD_LIMITS.MAX_UPLOAD_BYTES / 1024 / 1024} MB`,
    );
  }

  if (!isAcceptedMimeType(declaredMimeType)) {
    throw new UploadError(
      `Unsupported or invalid file type: ${declaredMimeType}. Upload a valid document, media, archive, or other file.`,
    );
  }

  const mimeType = declaredMimeType as AcceptedMimeType;
  if (filename !== undefined) {
    const lowerName = filename.toLowerCase();
    const knownExtensions = MIME_EXTENSIONS[mimeType];
    if (knownExtensions && !knownExtensions.some((extension) => lowerName.endsWith(extension))) {
      throw new UploadError('File extension does not match the declared file type');
    }
  }

  if (mimeType === 'application/pdf' && !hasBytes(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    throw new UploadError('File content does not match the declared file type');
  }

  if (ZIP_MIME_TYPES.has(mimeType) && !hasBytes(buffer, [0x50, 0x4b, 0x03, 0x04])) {
    throw new UploadError('File content does not match the declared file type');
  }

  if (ZIP_MIME_TYPES.has(mimeType)) {
    validateZipContainer(buffer);
  }

  if (OLE_MIME_TYPES.has(mimeType) && !hasBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    throw new UploadError('File content does not match the declared file type');
  }

  if (mimeType === 'application/rtf' && !buffer.toString('utf8', 0, 5).toLowerCase().startsWith('{\\rtf')) {
    throw new UploadError('File content does not match the declared file type');
  }

  if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv' ||
      mimeType === 'text/tab-separated-values' || mimeType === 'application/json' ||
      mimeType === 'application/xml' || mimeType === 'text/html' || mimeType === 'application/rtf') {
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      throw new UploadError('Text files must contain valid UTF-8');
    }
  }
}

function isAcceptedMimeType(value: string): boolean {
  return ACCEPTED_MIME_TYPES.includes(value as AcceptedMimeType) ||
    (isValidMimeType(value) && !/^application\/(?:x-msdownload|x-sh|x-executable|x-dosexec)$/i.test(value));
}

function isValidMimeType(value: string): boolean {
  return /^[a-z][a-z0-9!#$&^_.+-]*\/[a-z0-9!#$&^_.+-]+$/i.test(value);
}

function hasBytes(buffer: Buffer, signature: number[]): boolean {
  if (buffer.byteLength < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

/**
 * Inspect the ZIP central directory without extracting any entry. DOCX is a
 * ZIP container, so this blocks path traversal, excessive file counts, and
 * expansion-ratio bombs before a parser sees the bytes.
 */
function validateZipContainer(buffer: Buffer): void {
  const endOfCentralDirectory = findSignatureFromEnd(buffer, 0x06054b50);
  if (endOfCentralDirectory < 0 || endOfCentralDirectory + 22 > buffer.length) {
    throw new UploadError('DOCX archive is malformed');
  }

  const entryCount = buffer.readUInt16LE(endOfCentralDirectory + 10);
  const centralDirectorySize = buffer.readUInt32LE(endOfCentralDirectory + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(endOfCentralDirectory + 16);
  if (entryCount > UPLOAD_LIMITS.MAX_ARCHIVE_FILES || centralDirectoryOffset + centralDirectorySize > buffer.length) {
    throw new UploadError('DOCX archive exceeds safe archive limits');
  }

  let offset = centralDirectoryOffset;
  let compressedTotal = 0;
  let uncompressedTotal = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new UploadError('DOCX archive central directory is malformed');
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || (flags & 0x1) !== 0) {
      throw new UploadError('DOCX archive uses an unsupported or unsafe entry format');
    }

    const nameStart = offset + 46;
    const name = buffer.toString('utf8', nameStart, nameStart + nameLength);
    const normalizedName = name.replaceAll('\\', '/');
    const depth = normalizedName.split('/').filter(Boolean).length;
    if (normalizedName.startsWith('/') || normalizedName.split('/').includes('..') || depth > UPLOAD_LIMITS.MAX_ARCHIVE_NESTING) {
      throw new UploadError('DOCX archive contains an unsafe path');
    }

    compressedTotal += compressedSize;
    uncompressedTotal += uncompressedSize;
    offset = nameStart + nameLength + extraLength + commentLength;
  }

  if (uncompressedTotal > UPLOAD_LIMITS.MAX_EXTRACTED_BYTES ||
      (compressedTotal === 0 && uncompressedTotal > 0) ||
      (compressedTotal > 0 && uncompressedTotal / compressedTotal > UPLOAD_LIMITS.MAX_ARCHIVE_EXPANSION)) {
    throw new UploadError('DOCX archive exceeds safe expansion limits');
  }
}

function findSignatureFromEnd(buffer: Buffer, signature: number): number {
  // The ZIP end-of-central-directory record is located within the final
  // 65,557 bytes (22-byte record + a maximum 65,535-byte comment). The old
  // implementation searched from byte 65,557 near the *start* of larger
  // files, causing ordinary DOCX/PPTX/XLSX files to be rejected as malformed.
  const minimumOffset = Math.max(0, buffer.length - (0xffff + 22));
  const maximumOffset = buffer.length - 22;

  for (let offset = maximumOffset; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) !== signature) continue;

    const commentLength = buffer.readUInt16LE(offset + 20);
    if (offset + 22 + commentLength === buffer.length) return offset;
  }
  return -1;
}

/**
 * Validate a UUID string.
 */
export function validateUuid(value: string, fieldName: string): void {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(value)) {
    throw new ValidationError(`Invalid UUID for field '${fieldName}'`);
  }
}

/**
 * Validate pagination parameters.
 */
export function validatePagination(page: unknown, pageSize: unknown): { page: number; pageSize: number } {
  const p = parseStrictPositiveInteger(page, 1, 'page');
  const ps = parseStrictPositiveInteger(pageSize, 20, 'pageSize');

  if (ps > MAX_PAGE_SIZE) throw new ValidationError(`pageSize must be between 1 and ${MAX_PAGE_SIZE}`);

  return { page: p, pageSize: ps };
}

function parseStrictPositiveInteger(value: unknown, fallback: number, fieldName: string): number {
  if (value === undefined || value === null || value === '') return fallback;

  const text = String(value);
  if (!/^[1-9]\d*$/.test(text)) {
    throw new ValidationError(`${fieldName} must be a positive integer`);
  }

  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed)) {
    throw new ValidationError(`${fieldName} must be a safe positive integer`);
  }

  return parsed;
}

/**
 * Assert a string is non-empty.
 */
export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`'${fieldName}' is required and must be a non-empty string`);
  }
  return value.trim();
}
