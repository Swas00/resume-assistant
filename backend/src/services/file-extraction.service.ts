import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { logger } from '../utils/logger';

const MIN_TEXT_LENGTH = 50;

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

// pdfjs-dist is ESM-only and this project compiles to CommonJS, so it is loaded
// with a dynamic import (preserved by TS under NodeNext). The legacy build is the
// one that supports Node.
const loadPdfjs = () => import('pdfjs-dist/legacy/build/pdf.mjs');

/**
 * Extract text from PDF file
 * @param filePath - Path to PDF file
 * @returns Extracted text content
 */
export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const pdfjs = await loadPdfjs();

    // pdf.js requires a plain Uint8Array (a Node Buffer is rejected)
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(fileBuffer) });
    const pdf = await loadingTask.promise;

    try {
      const pages: string[] = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Text items have `str`; marked-content items do not
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/[ \t]+/g, ' '); // pdf.js emits whitespace items too; collapse the runs
        pages.push(pageText.trim());
      }
      return pages.join('\n').trim();
    } finally {
      await loadingTask.destroy(); // release the worker and document memory
    }
  } catch (error) {
    logger.error(`Error extracting PDF text from ${filePath}:`, error);
    throw new Error(`Failed to extract PDF text: ${errorMessage(error)}`);
  }
};

/**
 * Extract text from DOCX file
 * @param filePath - Path to DOCX file
 * @returns Extracted text content
 */
export const extractTextFromDOCX = async (filePath: string): Promise<string> => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value.trim();
  } catch (error) {
    logger.error(`Error extracting DOCX text from ${filePath}:`, error);
    throw new Error(`Failed to extract DOCX text: ${errorMessage(error)}`);
  }
};

/**
 * Extract text based on file type
 * @param filePath - Path to file
 * @param fileType - Type of file ('pdf' or 'docx')
 * @returns Extracted text content
 */
export const extractTextFromFile = async (
  filePath: string,
  fileType: 'pdf' | 'docx'
): Promise<string> => {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  logger.info(`Extracting text from ${fileType}: ${path.basename(filePath)}`);

  let extractedText: string;
  if (fileType === 'pdf') {
    extractedText = await extractTextFromPDF(filePath);
  } else if (fileType === 'docx') {
    extractedText = await extractTextFromDOCX(filePath);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  if (!extractedText || extractedText.length < MIN_TEXT_LENGTH) {
    throw new Error('Could not extract meaningful text from file. Please check the file format.');
  }

  logger.info(`Text extracted successfully. Length: ${extractedText.length} characters`);

  return extractedText;
};

/**
 * Clean up extracted text (collapse all whitespace, including newlines, to single spaces).
 * Note this removes line structure, so run it only where that is acceptable.
 */
export const cleanText = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};
