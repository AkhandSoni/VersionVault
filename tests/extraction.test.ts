import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { extractDocumentText } from '../src/services/extraction.service';

describe('document text extraction', () => {
  it('extracts normalized UTF-8 text files', async () => {
    const result = await extractDocumentText(
      Buffer.from('\uFEFFTitle\r\nPayment: $100\r\n', 'utf-8'),
      'text/plain',
    );

    expect(result.extractionStatus).toBe('READY');
    expect(result.kind).toBe('text');
    expect(result.text).toBe('Title\nPayment: $100');
  });

  it('does not decode invalid UTF-8 as reviewable text', async () => {
    const result = await extractDocumentText(Buffer.from([0xff, 0xfe, 0xfd]), 'text/plain');

    expect(result.extractionStatus).toBe('FAILED');
    expect(result.text).toBe('');
  });

  it('marks legacy doc files as unsupported instead of diffing binary bytes', async () => {
    const result = await extractDocumentText(Buffer.from('fake-binary'), 'application/msword');

    expect(result.extractionStatus).toBe('UNSUPPORTED');
    expect(result.kind).toBe('doc');
    expect(result.text).toBe('');
  });

  it('extracts reviewable text from PowerPoint XML without changing the stored file', async () => {
    const zip = new JSZip();
    zip.file('ppt/slides/slide1.xml', '<p:sld><a:t>Revenue increased</a:t><a:t>10 percent</a:t></p:sld>');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    const result = await extractDocumentText(
      buffer,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    );

    expect(result.extractionStatus).toBe('READY');
    expect(result.text).toContain('Revenue increased');
    expect(result.text).toContain('10 percent');
  });

  it('extracts shared strings and numeric cells from Excel XML', async () => {
    const zip = new JSZip();
    zip.file('xl/sharedStrings.xml', '<sst><si><t>Budget</t></si></sst>');
    zip.file('xl/worksheets/sheet1.xml', '<worksheet><sheetData><row><c r="A1" t="s"><v>0</v></c><c r="B1"><v>42</v></c></row></sheetData></worksheet>');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    const result = await extractDocumentText(
      buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    expect(result.extractionStatus).toBe('READY');
    expect(result.text).toContain('Budget');
    expect(result.text).toContain('42');
  });

  it('extracts accepted JSON as AI-readable text', async () => {
    const result = await extractDocumentText(
      Buffer.from('{"title":"Daily report","status":"approved"}', 'utf-8'),
      'application/json',
    );

    expect(result.extractionStatus).toBe('READY');
    expect(result.kind).toBe('json');
    expect(result.text).toContain('Daily report');
  });

  it('extracts accepted HTML as readable text instead of exposing markup instructions', async () => {
    const result = await extractDocumentText(
      Buffer.from('<main><h1>Project Plan</h1><p>Ship upload support.</p></main>', 'utf-8'),
      'text/html',
    );

    expect(result.extractionStatus).toBe('READY');
    expect(result.kind).toBe('html');
    expect(result.text).toContain('Project Plan');
    expect(result.text).toContain('Ship upload support.');
  });
});
