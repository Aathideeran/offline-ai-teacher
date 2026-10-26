import {
  RetrievedPassageResult,
  StudyDocument,
  SubjectId,
  SyllabusPassage,
} from '../../types';
import { CLASS_10_CHAPTERS } from './seedData';

const STOP_WORDS = new Set([
  'the',
  'is',
  'are',
  'what',
  'how',
  'why',
  'when',
  'where',
  'explain',
  'find',
  'solve',
  'calculate',
  'define',
  'state',
  'and',
  'or',
  'of',
  'in',
  'to',
  'for',
  'with',
  'a',
  'an',
  'on',
  'by',
  'from',
  'that',
  'this',
  'can',
  'you',
]);

export interface DocumentImportAnalysis {
  document: StudyDocument;
  passages: SyllabusPassage[];
}

/**
 * Inspects file name and raw content to detect binary or scanned PDFs or unsupported formats.
 * Never fabricates text when a PDF is scanned or unreadable.
 */
export function inspectAndChunkStudyDocument(params: {
  title: string;
  subjectId: SubjectId;
  className: string;
  chapterId: string;
  source: string;
  isOfficialSyllabus: boolean;
  fileName?: string;
  rawText: string;
}): DocumentImportAnalysis {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const trimmed = params.rawText.trim();
  const byteLength = new TextEncoder().encode(params.rawText).length;

  // 1. Check for raw PDF header or binary content
  const isPdfFile =
    params.fileName?.toLowerCase().endsWith('.pdf') || trimmed.startsWith('%PDF-');

  // Measure ratio of printable readable characters
  let printableCount = 0;
  const sampleLen = Math.min(trimmed.length, 2000);
  for (let i = 0; i < sampleLen; i++) {
    const code = trimmed.charCodeAt(i);
    if (
      (code >= 32 && code <= 126) ||
      code === 9 ||
      code === 10 ||
      code === 13 ||
      (code >= 0x0b80 && code <= 0x0bff) // Tamil Unicode block
    ) {
      printableCount++;
    }
  }
  const printableRatio = sampleLen > 0 ? printableCount / sampleLen : 0;

  if (isPdfFile && (trimmed.startsWith('%PDF-') || printableRatio < 0.85)) {
    return {
      document: {
        id: docId,
        title: params.title,
        subjectId: params.subjectId,
        className: params.className,
        chapterId: params.chapterId,
        source: params.source,
        isOfficialSyllabus: params.isOfficialSyllabus,
        isBuiltIn: false,
        importStatus: 'empty_or_scanned',
        statusNote:
          'Binary or scanned PDF detected. Direct PDF binary streams or scanned image PDFs require OCR or plain-text extraction (.txt / .md) before local passage indexing.',
        fileSizeBytes: byteLength,
        passageCount: 0,
        importedAt: now,
      },
      passages: [],
    };
  }

  if (trimmed.length < 20) {
    return {
      document: {
        id: docId,
        title: params.title,
        subjectId: params.subjectId,
        className: params.className,
        chapterId: params.chapterId,
        source: params.source,
        isOfficialSyllabus: params.isOfficialSyllabus,
        isBuiltIn: false,
        importStatus: 'empty_or_scanned',
        statusNote:
          'Document contains insufficient readable text (< 20 characters). No passages were indexed.',
        fileSizeBytes: byteLength,
        passageCount: 0,
        importedAt: now,
      },
      passages: [],
    };
  }

  // Split text into manageable passages by markdown headings or double newlines
  const rawBlocks = trimmed
    .split(/\n{2,}|(?=^#{1,3}\s)/m)
    .map((b) => b.trim())
    .filter((b) => b.length >= 20);

  const chapterMeta = CLASS_10_CHAPTERS.find((c) => c.id === params.chapterId);
  const chapterTitle = chapterMeta ? chapterMeta.titleEn : 'Imported Study Material';

  const passages: SyllabusPassage[] = [];
  let currentHeading = 'Section 1';

  rawBlocks.forEach((block, index) => {
    const lines = block.split('\n');
    let contentText = block;
    if (lines[0].startsWith('#')) {
      currentHeading = lines[0].replace(/^#+\s*/, '').trim();
      contentText = lines.slice(1).join(' ').trim() || currentHeading;
    } else if (lines[0].length < 80 && lines.length > 1 && !lines[0].endsWith('.')) {
      currentHeading = lines[0].trim();
      contentText = lines.slice(1).join(' ').trim();
    }

    // Extract formula-like strings (containing '=' or '^')
    const formulaMatches =
      contentText.match(/[A-Za-z0-9_()+-]+\s*=\s*[A-Za-z0-9_()+*/^√-\s]+/g) ?? [];

    passages.push({
      id: `pass_${docId}_${index + 1}`,
      documentId: docId,
      documentTitle: params.title,
      subjectId: params.subjectId,
      className: params.className,
      chapterId: params.chapterId,
      chapterTitle,
      sectionHeading: currentHeading || `Passage ${index + 1}`,
      content: contentText,
      formulas: formulaMatches.slice(0, 3).map((f) => f.trim()),
      sourceLabel: `${params.source} · ${params.title} (Passage ${index + 1})`,
      isOfficialSyllabus: params.isOfficialSyllabus,
    });
  });

  return {
    document: {
      id: docId,
      title: params.title,
      subjectId: params.subjectId,
      className: params.className,
      chapterId: params.chapterId,
      source: params.source,
      isOfficialSyllabus: params.isOfficialSyllabus,
      isBuiltIn: false,
      importStatus: 'ready',
      statusNote: `Successfully split into ${passages.length} searchable local passage(s).`,
      fileSizeBytes: byteLength,
      passageCount: passages.length,
      importedAt: now,
    },
    passages,
  };
}

/**
 * Tokenizes a search query into meaningful academic keywords.
 */
export function extractSearchKeywords(query: string): string[] {
  const cleaned = query
    .toLowerCase()
    .replace(/['"?!.,;:()[\]{}]/g, ' ')
    .trim();

  const words = cleaned
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  // Add domain synonym expansions for common Class 10 terms
  const expanded = new Set<string>(words);
  if (query.includes('x^2') || query.includes('x²')) {
    expanded.add('quadratic');
    expanded.add('discriminant');
    expanded.add('roots');
  }
  if (/\b(v\s*=\s*i\s*\*?\s*r|voltage|current|resistance|ampere|ohm)\b/i.test(query)) {
    expanded.add('ohm');
    expanded.add('resistance');
    expanded.add('current');
  }
  if (/\b(hcf|gcd|lcm)\b/i.test(query)) {
    expanded.add('hcf');
    expanded.add('lcm');
    expanded.add('euclid');
  }
  if (/\b(ap|nth term|common difference)\b/i.test(query)) {
    expanded.add('arithmetic');
    expanded.add('progression');
  }

  return Array.from(expanded);
}

/**
 * Searches locally stored syllabus passages using keyword, heading, and formula matching.
 * Designed modularly so vector embeddings can be plugged in alongside lexical scoring.
 */
export function searchLocalSyllabusPassages(
  passages: SyllabusPassage[],
  query: string,
  options?: {
    subjectId?: SubjectId;
    chapterId?: string;
    topK?: number;
  }
): RetrievedPassageResult[] {
  const keywords = extractSearchKeywords(query);
  if (keywords.length === 0) return [];

  const topK = options?.topK ?? 3;
  const results: RetrievedPassageResult[] = [];

  for (const passage of passages) {
    // Filter by subject if explicitly requested and not 'other'
    if (
      options?.subjectId &&
      options.subjectId !== 'other' &&
      passage.subjectId !== options.subjectId
    ) {
      continue;
    }

    const hayContent = passage.content.toLowerCase();
    const hayHeading = passage.sectionHeading.toLowerCase();
    const hayChapter = passage.chapterTitle.toLowerCase();
    const hayFormulas = passage.formulas.join(' ').toLowerCase();

    let score = 0;
    const matchedTerms: string[] = [];

    // Boost if chapter matches user-selected chapter
    if (
      options?.chapterId &&
      options.chapterId !== 'all' &&
      passage.chapterId === options.chapterId
    ) {
      score += 2.5;
    }

    for (const kw of keywords) {
      let termMatched = false;
      if (hayHeading.includes(kw)) {
        score += 4;
        termMatched = true;
      }
      if (hayChapter.includes(kw)) {
        score += 3;
        termMatched = true;
      }
      if (hayFormulas.includes(kw)) {
        score += 3.5;
        termMatched = true;
      }
      if (hayContent.includes(kw)) {
        score += 2;
        termMatched = true;
      }
      if (termMatched) {
        matchedTerms.push(kw);
      }
    }

    // Require at least one genuine keyword match in the passage
    if (matchedTerms.length > 0) {
      results.push({
        passage,
        relevanceScore: Number(score.toFixed(2)),
        matchedTerms,
      });
    }
  }

  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);
}
