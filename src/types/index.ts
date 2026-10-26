export type LanguageCode = 'en' | 'ta';

export type SubjectId = 'math_10' | 'science_10' | 'other';

export type ExplanationLevel = 'basic' | 'standard' | 'exam_prep';

export type UnderstandingLevel = 'understood' | 'partially_understood' | 'not_understood';

export type ModelStatus =
  | 'not_loaded'
  | 'downloading'
  | 'loading'
  | 'verifying'
  | 'ready'
  | 'unavailable'
  | 'error';

export type VerificationStatus =
  | 'verified'
  | 'mismatch'
  | 'unsupported_symbolic'
  | 'not_applicable';

export interface ChapterInfo {
  id: string;
  subjectId: SubjectId;
  number: number;
  titleEn: string;
  titleTa: string;
  keywords: string[];
}

export interface StudyDocument {
  id: string;
  title: string;
  subjectId: SubjectId;
  className: string;
  chapterId: string;
  source: string;
  isOfficialSyllabus: boolean;
  isBuiltIn: boolean;
  importStatus: 'ready' | 'unsupported_format' | 'empty_or_scanned' | 'error';
  statusNote?: string;
  fileSizeBytes: number;
  passageCount: number;
  importedAt: string;
}

export interface SyllabusPassage {
  id: string;
  documentId: string;
  documentTitle: string;
  subjectId: SubjectId;
  className: string;
  chapterId: string;
  chapterTitle: string;
  sectionHeading: string;
  content: string;
  formulas: string[];
  sourceLabel: string;
  isOfficialSyllabus: boolean;
}

export interface RetrievedPassageResult {
  passage: SyllabusPassage;
  relevanceScore: number;
  matchedTerms: string[];
}

export interface MathVerificationResult {
  status: VerificationStatus;
  expressionDetected: string | null;
  operationType:
    | 'arithmetic'
    | 'quadratic_equation'
    | 'linear_equation'
    | 'arithmetic_progression'
    | 'mensuration_trig'
    | 'symbolic_unsupported'
    | 'none';
  proposedResult: string | null;
  verifiedResult: string | null;
  steps: string[];
  explanation: string;
}

export interface HintLadder {
  hint1Concept: string;
  hint2NextStep: string;
  hint3Detailed: string;
}

export interface StructuredDoubtAnswer {
  whatQuestionAsks: string;
  conceptOrFormula: string;
  stepByStepReasoning: string[];
  finalAnswer: string;
  quickVerification: string;
  syllabusReferences: {
    documentTitle: string;
    chapterTitle: string;
    sectionHeading: string;
    sourceLabel: string;
    excerpt: string;
    isOfficialSyllabus: boolean;
  }[];
  isGroundedInSyllabus: boolean;
  ungroundedNotice?: string;
  practiceQuestion: {
    question: string;
    hint: string;
    answer: string;
    sourceType: 'imported_bank' | 'rule_template' | 'gemma_local';
  };
  hints: HintLadder;
  mathVerification: MathVerificationResult;
  generatedBy: 'gemma_local' | 'local_deterministic_engine';
  modelIdUsed: string | null;
  rawModelOutput?: string;
  inferenceLatencyMs?: number;
}

export interface ChatMessage {
  id: string;
  role: 'student' | 'assistant';
  content: string;
  mathExpression?: string;
  timestamp: string;
  subjectId: SubjectId;
  chapterId: string;
  explanationLevel: ExplanationLevel;
  structuredAnswer?: StructuredDoubtAnswer;
  revealedHintStage: 0 | 1 | 2 | 3 | 4;
  understandingRating?: UnderstandingLevel;
  savedToRevision?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  subjectId: SubjectId;
  chapterId: string;
  explanationLevel: ExplanationLevel;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface RevisionCard {
  id: string;
  subjectId: SubjectId;
  chapterId: string;
  question: string;
  conceptOrFormula: string;
  answer: string;
  sourceConversationId?: string;
  createdAt: string;
  nextReviewAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lastRating?: 'again' | 'hard' | 'good' | 'easy';
}

export interface TopicActivityRecord {
  id: string;
  subjectId: SubjectId;
  chapterId: string;
  questionSnippet: string;
  understanding: UnderstandingLevel;
  timestamp: string;
  source: 'doubt_solver' | 'practice';
}

export interface TopicProgressEstimate {
  subjectId: SubjectId;
  chapterId: string;
  totalInteractions: number;
  understoodCount: number;
  partiallyUnderstoodCount: number;
  notUnderstoodCount: number;
  estimatedScorePercent: number;
  status: 'strong' | 'developing' | 'needs_attention' | 'no_activity';
  lastActiveAt: string | null;
}

export interface PracticeQuestion {
  id: string;
  subjectId: SubjectId;
  chapterId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  expressionToVerify?: string;
  hint1: string;
  hint2: string;
  expectedAnswer: string;
  stepByStepSolution: string[];
  sourceType: 'imported_bank' | 'gemma_local';
  sourceDocumentTitle: string;
}

export type LocalProviderType = 'transformers_js_browser' | 'local_http_ollama';

export interface LocalModelSpec {
  id: string;
  displayName: string;
  family: 'Gemma 4' | 'Gemma 3';
  architecture: string;
  quantization: 'q4' | 'q4f16' | 'q2f16' | 'gguf_q4';
  approximateDownloadMB: number;
  minimumRamGB: number;
  requiresHardwareWebGPU: boolean;
  providerType: LocalProviderType;
  licenseName: string;
  description: string;
}

export interface LocalAIRuntimeConfig {
  providerType: LocalProviderType;
  modelId: string;
  endpointUrl: string;
  temperature: number;
  maxTokens: number;
}

export interface LocalAIStatusSnapshot {
  status: ModelStatus;
  modelId: string;
  runtimeName: string;
  executionBackend: 'webgpu' | 'wasm_cpu' | 'ollama_http' | 'none';
  downloadProgressPercent: number | null;
  activeDownloadFile: string | null;
  downloadedBytes: number | null;
  totalBytes: number | null;
  webGpuSupported: boolean;
  webGpuAdapterInfo: string | null;
  wasmSupported: boolean;
  estimatedDeviceMemoryGB: number | null;
  cachedModelFilesCount: number;
  lastSelfTestPrompt: string | null;
  lastSelfTestOutput: string | null;
  lastSelfTestLatencyMs: number | null;
  blockerReason: string | null;
  recommendedAlternativeModelId: string | null;
  errorMessage: string | null;
  lastCheckedAt: string;
}

export interface AppSettings {
  language: LanguageCode;
  defaultSubjectId: SubjectId;
  defaultExplanationLevel: ExplanationLevel;
  preferHintFirst: boolean;
  runtimeConfig: LocalAIRuntimeConfig;
}

export interface SavedAnswerRecord {
  id: string;
  conversationId: string;
  messageId: string;
  subjectId: SubjectId;
  chapterId: string;
  question: string;
  finalAnswer: string;
  conceptOrFormula: string;
  stepByStepReasoning: string[];
  savedAt: string;
}

export interface StorageBreakdown {
  conversationsCount: number;
  messagesCount: number;
  savedAnswersCount: number;
  documentsCount: number;
  passagesCount: number;
  revisionCardsCount: number;
  activityRecordsCount: number;
  practiceQuestionsCount: number;
  approximateBytes: number;
}
