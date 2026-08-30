import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { inferMimeType, validatePagination, validateUpload } from '../src/lib/validation';
import { parseSchema, RegisterRequestSchema } from '../src/lib/schemas';
import { checkRateLimit } from '../src/lib/rate-limit';

describe('request validation boundaries', () => {
  it('rejects permissive pagination values instead of partially parsing them', () => {
    expect(() => validatePagination('12abc', '20')).toThrow(/page must be a positive integer/);
    expect(() => validatePagination('1.999', '20')).toThrow(/page must be a positive integer/);
    expect(() => validatePagination('1', '101')).toThrow(/pageSize must be between 1 and 100/);
  });

  it('accepts valid pagination values', () => {
    expect(validatePagination('2', '50')).toEqual({ page: 2, pageSize: 50 });
  });

  it('infers common Office types when browsers report octet-stream', () => {
    expect(inferMimeType('board-deck.pptx', 'application/octet-stream'))
      .toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    expect(inferMimeType('forecast.xlsx', ''))
      .toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(inferMimeType('notes.txt', 'application/octet-stream')).toBe('text/plain');
  });

  it('allows unknown safe MIME types for immutable storage', () => {
    expect(inferMimeType('research.custom', 'application/x-custom-format'))
      .toBe('application/x-custom-format');
    expect(() => validateUpload(Buffer.from([0, 1, 2, 3]), 'application/x-custom-format', 'research.custom'))
      .not.toThrow();
  });

  it('enforces the stronger registration password boundary', () => {
    expect(() => parseSchema(RegisterRequestSchema, {
      email: 'person@example.com',
      password: 'short',
      fullName: 'Person',
    })).toThrow(/12 characters/);

    expect(parseSchema(RegisterRequestSchema, {
      email: 'person@example.com',
      password: 'long-enough-password',
      fullName: 'Person',
    })).toMatchObject({ email: 'person@example.com' });
  });

  it('requires file signatures and matching extensions for binary uploads', () => {
    expect(() => validateUpload(Buffer.from('not a pdf'), 'application/pdf', 'report.pdf'))
      .toThrow(/content does not match/);
    expect(() => validateUpload(Buffer.from('%PDF-1.7'), 'application/pdf', 'report.txt'))
      .toThrow(/extension does not match/);
    expect(() => validateUpload(Buffer.from('%PDF-1.7'), 'application/pdf', 'report.pdf'))
      .not.toThrow();
  });

  it('rejects empty and invalid UTF-8 text uploads', () => {
    expect(() => validateUpload(Buffer.alloc(0), 'text/plain', 'empty.txt'))
      .toThrow(/cannot be empty/);
    expect(() => validateUpload(Buffer.from([0xc3, 0x28]), 'text/plain', 'bad.txt'))
      .toThrow(/valid UTF-8/);
  });

  it('rejects unsafe DOCX archive paths and expansion ratios before parsing', () => {
    const makeZip = (name: string, compressedSize: number, uncompressedSize: number) => {
      const filename = Buffer.from(name, 'utf8');
      const payload = Buffer.alloc(Math.max(1, compressedSize));
      const local = Buffer.alloc(30 + filename.length + payload.length);
      local.writeUInt32LE(0x04034b50, 0);
      local.writeUInt16LE(filename.length, 26);
      filename.copy(local, 30);
      payload.copy(local, 30 + filename.length);

      const central = Buffer.alloc(46 + filename.length);
      central.writeUInt32LE(0x02014b50, 0);
      central.writeUInt32LE(compressedSize, 20);
      central.writeUInt32LE(uncompressedSize, 24);
      central.writeUInt16LE(filename.length, 28);
      filename.copy(central, 46);

      const end = Buffer.alloc(22);
      end.writeUInt32LE(0x06054b50, 0);
      end.writeUInt16LE(1, 8);
      end.writeUInt16LE(1, 10);
      end.writeUInt32LE(central.length, 12);
      end.writeUInt32LE(local.length, 16);
      return Buffer.concat([local, central, end]);
    };

    expect(() => validateUpload(
      makeZip('../escape.xml', 10, 10),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'agreement.docx',
    )).toThrow(/unsafe path/);

    expect(() => validateUpload(
      makeZip('word/document.xml', 1, 100),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'agreement.docx',
    )).toThrow(/expansion limits/);
  });

  it('accepts Office ZIP archives whose central directory is beyond the first 65 KB', async () => {
    const zip = new JSZip();
    zip.file('word/document.xml', Buffer.alloc(96 * 1024, 0x61));
    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });

    expect(buffer.byteLength).toBeGreaterThan(0xffff + 22);
    expect(() => validateUpload(
      buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'agreement.docx',
    )).not.toThrow();
  });

  it('limits bursts and reports the retry window', () => {
    const first = checkRateLimit('test-rate-limit', 2, 60_000, 1_000);
    const second = checkRateLimit('test-rate-limit', 2, 60_000, 1_001);
    const third = checkRateLimit('test-rate-limit', 2, 60_000, 1_002);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });
});
