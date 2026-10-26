import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateArithmeticExpression,
  solveQuadraticEquation,
  solveLinearEquation,
  verifyMathematics,
} from './math/mathEngine';
import {
  inspectAndChunkStudyDocument,
  searchLocalSyllabusPassages,
} from './syllabus/retrievalEngine';
import { INITIAL_SYLLABUS_PASSAGES, CLASS_10_CHAPTERS, INITIAL_PRACTICE_QUESTIONS } from './syllabus/seedData';
import {
  scheduleNextCardReview,
  calculateTopicProgress,
} from './revision/spacedRepetition';
import {
  buildDeterministicDoubtAnswer,
  GemmaLocalRuntimeAdapter,
} from './ai/localAIProvider';

test('Mathematics Verification Engine: evaluates arithmetic and functions accurately', () => {
  assert.equal(evaluateArithmeticExpression('(18 * 4) / 6 + sqrt(81)'), 21);
  assert.equal(evaluateArithmeticExpression('gcd(306, 657)'), 9);
  assert.equal(evaluateArithmeticExpression('lcm(306, 657)'), 22338);
  assert.equal(evaluateArithmeticExpression('sin(30)'), 0.5);
});

test('Mathematics Verification Engine: solves quadratic equations and verifies roots', () => {
  const quad = solveQuadraticEquation('x^2 - 7x + 12 = 0');
  assert.ok(quad);
  assert.deepEqual(quad.roots, [3, 4]);
  assert.equal(quad.discriminant, 1);

  const verification = verifyMathematics('Solve x^2 - 5x + 6 = 0', 'x^2 - 5x + 6 = 0', '2, 3');
  assert.equal(verification.status, 'verified');
  assert.equal(verification.verifiedResult, '2, 3');

  const mismatch = verifyMathematics('Solve x^2 - 5x + 6 = 0', 'x^2 - 5x + 6 = 0', '1, 6');
  assert.equal(mismatch.status, 'mismatch');
});

test('Mathematics Verification Engine: solves linear equations and flags unsupported symbolic proofs', () => {
  const lin = solveLinearEquation('3x + 5 = 20');
  assert.ok(lin);
  assert.equal(lin.root, 5);

  const symbolic = verifyMathematics('Prove that sqrt(2) is an irrational number');
  assert.equal(symbolic.status, 'unsupported_symbolic');
});

test('Syllabus Retrieval Engine: detects binary/scanned PDFs honestly and chunks valid study text', () => {
  const scannedPdf = inspectAndChunkStudyDocument({
    title: 'Scanned Notes.pdf',
    subjectId: 'math_10',
    className: 'Class 10',
    chapterId: 'math_10_ch1',
    source: 'Student Upload',
    isOfficialSyllabus: false,
    fileName: 'Scanned Notes.pdf',
    rawText: '%PDF-1.7 \x00\x01\x02\x03 binary stream without text',
  });
  assert.equal(scannedPdf.document.importStatus, 'empty_or_scanned');
  assert.equal(scannedPdf.passages.length, 0);

  const validNotes = inspectAndChunkStudyDocument({
    title: 'Chapter 3 Custom Notes',
    subjectId: 'math_10',
    className: 'Class 10',
    chapterId: 'math_10_ch3',
    source: 'Class Notes',
    isOfficialSyllabus: true,
    fileName: 'notes.md',
    rawText:
      '# Nature of Roots\nWhen discriminant D = b^2 - 4ac > 0, the quadratic equation has two distinct real roots.\n\n# Sum and Product\nSum of roots is -b/a and product of roots is c/a.',
  });
  assert.equal(validNotes.document.importStatus, 'ready');
  assert.equal(validNotes.passages.length, 2);
});

test('Syllabus Retrieval Engine: retrieves relevant Class 10 passages offline', () => {
  const results = searchLocalSyllabusPassages(
    INITIAL_SYLLABUS_PASSAGES,
    'Explain Ohm\'s law and resistance in series',
    { subjectId: 'science_10' }
  );
  assert.ok(results.length > 0);
  assert.equal(results[0].passage.chapterId, 'sci_10_ch5');
});

test('Spaced Repetition & Weak-Topic Engine: schedules reviews and estimates progress accurately', () => {
  const now = new Date('2026-10-26T10:00:00.000Z');
  const nextGood = scheduleNextCardReview(
    {
      id: 'c1',
      subjectId: 'math_10',
      chapterId: 'math_10_ch3',
      question: 'Q',
      conceptOrFormula: 'F',
      answer: 'A',
      createdAt: now.toISOString(),
      nextReviewAt: now.toISOString(),
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 1,
    },
    'good',
    now
  );
  assert.ok(nextGood.intervalDays >= 3);
  assert.equal(nextGood.repetitions, 2);

  const progress = calculateTopicProgress(CLASS_10_CHAPTERS, [
    {
      id: 'a1',
      subjectId: 'math_10',
      chapterId: 'math_10_ch3',
      questionSnippet: 'Quadratic roots',
      understanding: 'not_understood',
      timestamp: now.toISOString(),
      source: 'doubt_solver',
    },
  ]);
  const ch3 = progress.find((p) => p.chapterId === 'math_10_ch3');
  assert.ok(ch3);
  assert.equal(ch3.status, 'needs_attention');
});

test('Doubt Solver Engine: never fakes Gemma inference and warns when question is ungrounded', () => {
  const ungrounded = buildDeterministicDoubtAnswer({
    question: 'Explain quantum chromodynamics and quark confinement',
    subjectId: 'science_10',
    chapterId: 'all',
    explanationLevel: 'standard',
    retrievedPassages: [],
    practiceBank: INITIAL_PRACTICE_QUESTIONS,
  });
  assert.equal(ungrounded.generatedBy, 'local_deterministic_engine');
  assert.equal(ungrounded.isGroundedInSyllabus, false);
  assert.ok(ungrounded.ungroundedNotice);
});

test('GemmaLocalRuntimeAdapter: probes hardware compatibility honestly and recommends verified Gemma 3 270M ONNX when Gemma 4 E2B lacks hardware WebGPU', async () => {
  const adapter = new GemmaLocalRuntimeAdapter();
  const gemma4Snap = await adapter.probeCompatibility({
    providerType: 'transformers_js_browser',
    modelId: 'onnx-community/gemma-4-E2B-it-ONNX',
    endpointUrl: 'http://127.0.0.1:11434',
    temperature: 0.2,
    maxTokens: 160,
  });
  assert.equal(gemma4Snap.status, 'unavailable');
  assert.ok(gemma4Snap.blockerReason?.includes('Gemma4ForConditionalGeneration'));
  assert.equal(
    gemma4Snap.recommendedAlternativeModelId,
    'onnx-community/gemma-3-270m-it-ONNX'
  );

  const gemma3Snap = await adapter.probeCompatibility({
    providerType: 'transformers_js_browser',
    modelId: 'onnx-community/gemma-3-270m-it-ONNX',
    endpointUrl: 'http://127.0.0.1:11434',
    temperature: 0.2,
    maxTokens: 160,
  });
  assert.equal(gemma3Snap.status, 'not_loaded');
  assert.equal(gemma3Snap.blockerReason, null);
  assert.equal(gemma3Snap.executionBackend, 'wasm_cpu');
});

