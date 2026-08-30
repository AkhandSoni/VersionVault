import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { createServiceClient } from '@/lib/supabase/server';
import { UPLOAD_LIMITS } from '@/lib/constants';
import { sha256 } from '@/lib/hash';

export type ExtractionKind = 'text' | 'markdown' | 'csv' | 'tsv' | 'json' | 'xml' | 'html' | 'rtf' | 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'odf' | 'doc' | 'ppt' | 'xls' | 'unknown';
export type ExtractionStatus = 'READY' | 'UNSUPPORTED' | 'FAILED';

export type ExtractedDocument = {
  text: string;
  kind: ExtractionKind;
  extractionStatus: ExtractionStatus;
  extractor: string;
  warnings: string[];
  error?: string;
};

export type StoredVersionText = {
  versionId: string;
  documentId: string;
  tenantId: string;
  mimeType: string;
  textContent: string;
  textHash: string | null;
  extractionStatus: ExtractionStatus;
  extractor: string;
  warnings: string[];
  error?: string | null;
};

export async function startProcessingJob(versionId: string): Promise<string | null> {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('processing_jobs')
      .insert({
        version_id: versionId,
        status: 'RUNNING',
        attempt_count: 1,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    return error || !data ? null : data.id;
  } catch {
    return null;
  }
}

export async function finishProcessingJob(jobId: string, status: 'COMPLETED' | 'FAILED', error?: string): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase
      .from('processing_jobs')
      .update({
        status,
        error: error ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } catch {
    // Processing state is auxiliary to the immutable stored version. A
    // missing/temporarily unavailable job table must not corrupt history.
  }
}

const MIME_TO_KIND: Record<string, ExtractionKind> = {
  'text/plain': 'text',
  'text/markdown': 'markdown',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.oasis.opendocument.text': 'odf',
  'application/vnd.oasis.opendocument.presentation': 'odf',
  'application/vnd.oasis.opendocument.spreadsheet': 'odf',
  'application/rtf': 'rtf',
  'text/csv': 'csv',
  'text/tab-separated-values': 'tsv',
  'application/json': 'json',
  'application/xml': 'xml',
  'text/html': 'html',
};

export function extractDocumentText(buffer: Buffer, mimeType: string): Promise<ExtractedDocument> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<ExtractedDocument>((resolve) => {
    timeoutId = setTimeout(() => resolve({
      text: '',
      kind: MIME_TO_KIND[mimeType] ?? 'unknown',
      extractionStatus: 'FAILED',
      extractor: 'timeout',
      warnings: [],
      error: 'Document processing exceeded the maximum allowed time',
    }), UPLOAD_LIMITS.MAX_PROCESSING_TIME_MS);
  });
  return Promise.race([extractDocumentTextInternal(buffer, mimeType), timeout])
    .finally(() => clearTimeout(timeoutId));
}

async function extractDocumentTextInternal(buffer: Buffer, mimeType: string): Promise<ExtractedDocument> {
  const kind = MIME_TO_KIND[mimeType] ?? 'unknown';

  try {
    if (kind === 'text' || kind === 'markdown') {
      return readyExtraction(decodeUtf8(buffer), kind, 'utf8');
    }

    if (kind === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      const warnings = result.messages.map((message) => message.message);
      return readyExtraction(result.value, kind, 'mammoth', warnings);
    }

    if (kind === 'pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const info = await parser.getInfo();
        if (info.total > UPLOAD_LIMITS.MAX_PAGES) {
          return {
            text: '',
            kind,
            extractionStatus: 'UNSUPPORTED',
            extractor: 'pdf-parse',
            warnings: [`PDF exceeds the ${UPLOAD_LIMITS.MAX_PAGES}-page processing limit.`],
          };
        }
        const result = await parser.getText();
        const text = normalizeExtractedText(result.text);
        if (!text.trim()) {
          return {
            text: '',
            kind,
            extractionStatus: 'UNSUPPORTED',
            extractor: 'pdf-parse',
            warnings: ['No selectable text was found. Scanned PDFs need OCR before diffing.'],
          };
        }
        return readyExtraction(text, kind, 'pdf-parse');
      } finally {
        await parser.destroy();
      }
    }

    if (kind === 'pptx' || kind === 'xlsx' || kind === 'odf') {
      const text = await extractZipOfficeText(buffer, kind);
      return readyExtraction(text, kind, 'jszip');
    }

    if (kind === 'rtf') {
      return readyExtraction(stripRtf(decodeUtf8(buffer)), kind, 'rtf-text');
    }

    return {
      text: '',
      kind,
      extractionStatus: 'UNSUPPORTED',
      extractor: 'none',
      warnings: [`${mimeType} is stored but text extraction is not supported yet.`],
    };
  } catch (err) {
    return {
      text: '',
      kind,
      extractionStatus: 'FAILED',
      extractor: kind === 'pdf' ? 'pdf-parse' : kind === 'docx' ? 'mammoth' : 'utf8',
      warnings: [],
      error: err instanceof Error ? err.message : 'Text extraction failed',
    };
  }
}

async function extractZipOfficeText(buffer: Buffer, kind: 'pptx' | 'xlsx' | 'odf'): Promise<string> {
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: false, createFolders: false });
  const files = Object.values(zip.files).filter((file) => !file.dir);

  if (kind === 'pptx') {
    const slides = files
      .filter((file) => /^ppt\/slides\/slide\d+\.xml$/i.test(file.name))
      .sort((a, b) => naturalFileOrder(a.name, b.name));
    const text = await Promise.all(slides.map(async (file) => extractXmlText(await file.async('string'))));
    return text.filter(Boolean).join('\n\n');
  }

  if (kind === 'xlsx') {
    const sharedStringsFile = files.find((file) => file.name.toLowerCase() === 'xl/sharedstrings.xml');
    const sharedStrings = sharedStringsFile
      ? extractSharedStrings(await sharedStringsFile.async('string'))
      : [];
    const sheets = files
      .filter((file) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(file.name))
      .sort((a, b) => naturalFileOrder(a.name, b.name));
    const text = await Promise.all(sheets.map(async (file) => extractWorksheetText(await file.async('string'), sharedStrings)));
    return text.filter(Boolean).join('\n\n');
  }

  const content = files.find((file) => file.name.toLowerCase() === 'content.xml');
  return content ? extractXmlText(await content.async('string')) : '';
}

function naturalFileOrder(left: string, right: string): number {
  const leftNumber = Number(left.match(/(\d+)\.xml$/i)?.[1] ?? 0);
  const rightNumber = Number(right.match(/(\d+)\.xml$/i)?.[1] ?? 0);
  return leftNumber - rightNumber;
}

function extractSharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/gi)]
    .map((match) => extractXmlText(match[1]));
}

function extractWorksheetText(xml: string, sharedStrings: string[]): string {
  return [...xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/gi)]
    .map((row) => [...row[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/gi)]
      .map((cell) => {
        const cellType = cell[1].match(/\bt="([^"]*)"/i)?.[1];
        const value = cell[2].match(/<v>([\s\S]*?)<\/v>/i)?.[1] ?? extractXmlText(cell[2]);
        if (cellType === 's') return sharedStrings[Number(value)] ?? value;
        if (cellType === 'inlineStr') return extractXmlText(cell[2]);
        return decodeXml(value);
      })
      .join('\t'))
    .join('\n');
}

function extractXmlText(xml: string): string {
  const text = [...xml.matchAll(/<(?:a:t|text:p|text:h|t)(?:\s[^>]*)?>([\s\S]*?)<\/(?:a:t|text:p|text:h|t)>/gi)]
    .map((match) => decodeXml(match[1].replace(/<[^>]+>/g, '')))
    .join('\n');
  return text || decodeXml(xml.replace(/<[^>]+>/g, ' '));
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)));
}

function stripRtf(value: string): string {
  return value
    .replace(/\\'[0-9a-f]{2}/gi, '')
    .replace(/\\[a-z]+\d*\s?/gi, '')
    .replace(/[{}]/g, '')
    .replace(/\\([\\{}])/g, '$1');
}

export async function storeVersionText(params: {
  tenantId: string;
  documentId: string;
  versionId: string;
  mimeType: string;
  extracted: ExtractedDocument;
}): Promise<void> {
  const supabase = await createServiceClient();
  const bounded = truncateText(params.extracted.text, UPLOAD_LIMITS.MAX_DOCUMENT_TEXT_SIZE);
  const warnings = bounded.truncated
    ? [...params.extracted.warnings, `Stored extracted text was truncated at ${UPLOAD_LIMITS.MAX_DOCUMENT_TEXT_SIZE} bytes.`]
    : params.extracted.warnings;

  const { error } = await supabase.from('version_texts').upsert({
    version_id: params.versionId,
    document_id: params.documentId,
    tenant_id: params.tenantId,
    mime_type: params.mimeType,
    text_content: bounded.text,
    text_hash: bounded.text ? sha256(Buffer.from(bounded.text, 'utf-8')) : null,
    extraction_status: params.extracted.extractionStatus,
    extractor: params.extracted.extractor,
    warnings,
    error: params.extracted.error ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to store extracted version text: ${error.message}`);
  }
}

export async function getVersionText(versionId: string): Promise<StoredVersionText | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('version_texts')
    .select('*')
    .eq('version_id', versionId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    versionId: data.version_id,
    documentId: data.document_id,
    tenantId: data.tenant_id,
    mimeType: data.mime_type,
    textContent: data.text_content ?? '',
    textHash: data.text_hash,
    extractionStatus: data.extraction_status,
    extractor: data.extractor,
    warnings: data.warnings ?? [],
    error: data.error,
  };
}

export async function getVersionTextContent(versionId: string): Promise<string | undefined> {
  const row = await getVersionText(versionId);
  if (!row || row.extractionStatus !== 'READY') return undefined;
  return row.textContent;
}

export async function getVersionTextContents(versionIds: string[]): Promise<Map<string, string>> {
  if (versionIds.length === 0) return new Map();

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('version_texts')
    .select('version_id, text_content, extraction_status')
    .in('version_id', versionIds);

  if (error || !data) return new Map();

  return new Map(
    data
      .filter((row) => row.extraction_status === 'READY')
      .map((row) => [row.version_id as string, (row.text_content as string) ?? '']),
  );
}

function decodeUtf8(buffer: Buffer): string {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  return decoder.decode(buffer);
}

function readyExtraction(
  rawText: string,
  kind: ExtractionKind,
  extractor: string,
  warnings: string[] = [],
): ExtractedDocument {
  const bounded = truncateText(normalizeExtractedText(rawText), UPLOAD_LIMITS.MAX_EXTRACTED_BYTES);
  return {
    text: bounded.text,
    kind,
    extractionStatus: 'READY',
    extractor,
    warnings: bounded.truncated
      ? [...warnings, `Extracted text was truncated at ${UPLOAD_LIMITS.MAX_EXTRACTED_BYTES} bytes.`]
      : warnings,
  };
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .trim();
}

function truncateText(text: string, maxBytes: number): { text: string; truncated: boolean } {
  const bytes = Buffer.byteLength(text, 'utf-8');
  if (bytes <= maxBytes) return { text, truncated: false };

  let end = text.length;
  while (Buffer.byteLength(text.slice(0, end), 'utf-8') > maxBytes) {
    end = Math.floor(end * 0.9);
  }
  return { text: text.slice(0, end), truncated: true };
}
