import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  HardDrive,
  HelpCircle,
  Lightbulb,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  ChapterInfo,
  LanguageCode,
  LocalAIRuntimeConfig,
  LocalAIStatusSnapshot,
  PracticeQuestion,
  SubjectId,
  UnderstandingLevel,
} from '../types';
import { TRANSLATIONS } from '../modules/i18n/translations';
import { compareProposedToVerified, verifyMathematics } from '../modules/math/mathEngine';
import { LOCAL_GEMMA_MODELS } from '../modules/ai/localAIProvider';

interface PracticeWorkspaceProps {
  language: LanguageCode;
  questions: PracticeQuestion[];
  chapters: ChapterInfo[];
  modelStatus: LocalAIStatusSnapshot;
  onRecordPracticeAttempt: (params: {
    subjectId: SubjectId;
    chapterId: string;
    questionSnippet: string;
    understanding: UnderstandingLevel;
  }) => Promise<void>;
  onGenerateAIPracticeQuestion: (subjectId: SubjectId) => Promise<boolean>;
}

export const PracticeWorkspace: React.FC<PracticeWorkspaceProps> = ({
  language,
  questions,
  chapters,
  modelStatus,
  onRecordPracticeAttempt,
  onGenerateAIPracticeQuestion,
}) => {
  const t = TRANSLATIONS[language];
  const [filterSubject, setFilterSubject] = useState<SubjectId | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [revealedHints, setRevealedHints] = useState<0 | 1 | 2>(0);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiGenNotice, setAiGenNotice] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);

  const filteredQuestions = questions.filter(
    (q) => filterSubject === 'all' || q.subjectId === filterSubject
  );
  const activeQuestion = filteredQuestions[currentIndex] ?? filteredQuestions[0] ?? null;

  const handleCheckAnswer = async () => {
    if (!activeQuestion || !studentAnswer.trim()) return;

    const expectedNums = (
      activeQuestion.expectedAnswer.match(/[+-]?\d+(\.\d+)?/g) ?? []
    ).map(Number);

    const isMatch = compareProposedToVerified(
      studentAnswer,
      activeQuestion.expectedAnswer,
      expectedNums
    );

    const mathCheck = activeQuestion.expressionToVerify
      ? verifyMathematics(
          activeQuestion.question,
          activeQuestion.expressionToVerify,
          studentAnswer
        )
      : null;

    setVerificationFeedback({
      isCorrect: isMatch,
      message: isMatch
        ? `Correct! Verified Answer: ${activeQuestion.expectedAnswer}. ${
            mathCheck?.explanation || ''
          }`
        : `Not quite. Your answer "${studentAnswer}" differs from the verified result (${activeQuestion.expectedAnswer}). Try viewing Hint 1 or the step-by-step solution.`,
    });

    await onRecordPracticeAttempt({
      subjectId: activeQuestion.subjectId,
      chapterId: activeQuestion.chapterId,
      questionSnippet: activeQuestion.question,
      understanding: isMatch ? 'understood' : 'partially_understood',
    });
  };

  const handleNextQuestion = () => {
    setStudentAnswer('');
    setRevealedHints(0);
    setShowSolution(false);
    setVerificationFeedback(null);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, filteredQuestions.length));
  };

  const handleGenerateWithLocalGemma = async () => {
    if (modelStatus.status !== 'ready') return;
    setIsGeneratingAI(true);
    setAiGenNotice(null);
    try {
      const targetSubject: SubjectId =
        filterSubject === 'all' ? 'math_10' : filterSubject;
      const created = await onGenerateAIPracticeQuestion(targetSubject);
      if (created) {
        setCurrentIndex(0);
        setStudentAnswer('');
        setRevealedHints(0);
        setShowSolution(false);
        setVerificationFeedback(null);
        setAiGenNotice(
          `Generated a new practice question locally using ${modelStatus.modelId}.`
        );
      } else {
        setAiGenNotice(
          'Local Gemma model returned an unformatted response; try generating again.'
        );
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.practice.title}</h1>
            <p className="text-xs text-slate-600 mt-1">{t.practice.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter practice questions by subject"
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value as SubjectId | 'all');
                setCurrentIndex(0);
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">All Subjects ({questions.length})</option>
              <option value="math_10">{t.subjects.math_10}</option>
              <option value="science_10">{t.subjects.science_10}</option>
            </select>

            <button
              type="button"
              onClick={handleGenerateWithLocalGemma}
              disabled={modelStatus.status !== 'ready' || isGeneratingAI}
              title={
                modelStatus.status !== 'ready'
                  ? t.practice.aiUnavailableNote
                  : t.practice.generateWithAIButton
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-500 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`}
              />
              <span>
                {isGeneratingAI
                  ? 'Generating on Local Gemma...'
                  : t.practice.generateWithAIButton}
              </span>
            </button>
          </div>
        </div>

        {modelStatus.status !== 'ready' && (
          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            {t.practice.aiUnavailableNote}
          </div>
        )}

        {aiGenNotice && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{aiGenNotice}</span>
          </div>
        )}
      </section>

      {activeQuestion && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-900">
                {t.subjects[activeQuestion.subjectId]}
              </span>
              <span aria-hidden="true"> · </span>
              <span>
                {chapters.find((c) => c.id === activeQuestion.chapterId)?.titleEn ||
                  'Class 10'}
              </span>
              <span aria-hidden="true"> · </span>
              <span className="capitalize">Difficulty: {activeQuestion.difficulty}</span>
            </div>

            <span>
              Source:{' '}
              <strong className="text-slate-800">
                {activeQuestion.sourceType === 'imported_bank'
                  ? t.practice.sourceImportedBank
                  : t.practice.sourceGemmaLocal}
              </strong>{' '}
              ({currentIndex + 1} of {filteredQuestions.length})
            </span>
          </div>

          <p className="text-base font-semibold text-slate-900 leading-relaxed">
            {activeQuestion.question}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              aria-label={t.practice.yourAnswerPlaceholder}
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              placeholder={t.practice.yourAnswerPlaceholder}
              className="flex-1 min-w-[220px] px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
            <button
              type="button"
              onClick={handleCheckAnswer}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {t.practice.checkAnswer}
            </button>
            <button
              type="button"
              onClick={() =>
                setRevealedHints((prev) => (prev < 2 ? ((prev + 1) as 1 | 2) : 2))
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{t.practice.showHint}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSolution((prev) => !prev)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {t.practice.showSolution}
            </button>
            <button
              type="button"
              onClick={handleNextQuestion}
              className="px-3.5 py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {t.practice.nextQuestion} →
            </button>
          </div>

          {verificationFeedback && (
            <div
              className={`p-3.5 rounded-lg border text-xs ${
                verificationFeedback.isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {verificationFeedback.message}
            </div>
          )}

          {revealedHints >= 1 && (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-800">
              <p>
                <strong>Hint 1:</strong> {activeQuestion.hint1}
              </p>
              {revealedHints >= 2 && (
                <p>
                  <strong>Hint 2:</strong> {activeQuestion.hint2}
                </p>
              )}
            </div>
          )}

          {showSolution && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-semibold text-slate-900">
                Verified Step-by-Step Solution ({activeQuestion.sourceDocumentTitle})
              </h3>
              <ol className="list-decimal list-inside text-xs text-slate-800 space-y-1.5">
                {activeQuestion.stepByStepSolution.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <p className="text-xs font-mono font-bold text-emerald-700 pt-1">
                Verified Answer: {activeQuestion.expectedAnswer}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

interface ModelSetupViewProps {
  language: LanguageCode;
  modelStatus: LocalAIStatusSnapshot;
  runtimeConfig: LocalAIRuntimeConfig;
  swRegistered: boolean;
  passagesCount: number;
  onUpdateRuntimeConfig: (config: LocalAIRuntimeConfig) => Promise<void>;
  onProbeCompatibility: (config: LocalAIRuntimeConfig) => Promise<void>;
  onConnectModel: (config: LocalAIRuntimeConfig) => Promise<void>;
  onDisconnectModel: () => void;
  onRunLiveInferenceTest: (promptText: string) => Promise<void>;
  onClearModelCache: () => Promise<void>;
}

function formatBytesToMB(bytes: number | null): string {
  if (bytes === null || bytes <= 0) return '0.0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ModelSetupView: React.FC<ModelSetupViewProps> = ({
  language,
  modelStatus,
  runtimeConfig,
  swRegistered,
  passagesCount,
  onUpdateRuntimeConfig,
  onProbeCompatibility,
  onConnectModel,
  onDisconnectModel,
  onRunLiveInferenceTest,
  onClearModelCache,
}) => {
  const t = TRANSLATIONS[language];
  const [selectedModelId, setSelectedModelId] = useState<string>(
    runtimeConfig.modelId || 'onnx-community/gemma-3-270m-it-ONNX'
  );
  const [providerType, setProviderType] = useState<LocalAIRuntimeConfig['providerType']>(
    runtimeConfig.providerType || 'transformers_js_browser'
  );
  const [endpointUrl, setEndpointUrl] = useState<string>(
    runtimeConfig.endpointUrl || 'http://127.0.0.1:11434'
  );
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [customTestPrompt, setCustomTestPrompt] = useState<string>(
    'Find the roots of x^2 - 7x + 12 = 0 and explain in two short steps.'
  );
  const [isRunningCustomTest, setIsRunningCustomTest] = useState<boolean>(false);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);

  const selectedSpec =
    LOCAL_GEMMA_MODELS.find((m) => m.id === selectedModelId) ?? LOCAL_GEMMA_MODELS[0];

  const handleSelectModelChange = async (newModelId: string) => {
    setSelectedModelId(newModelId);
    const spec = LOCAL_GEMMA_MODELS.find((m) => m.id === newModelId);
    const nextProvider = spec ? spec.providerType : providerType;
    setProviderType(nextProvider);

    const updated: LocalAIRuntimeConfig = {
      ...runtimeConfig,
      providerType: nextProvider,
      modelId: newModelId,
      endpointUrl: endpointUrl.trim() || 'http://127.0.0.1:11434',
    };
    await onUpdateRuntimeConfig(updated);
    await onProbeCompatibility(updated);
  };

  const handleLoadAndVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setCacheNotice(null);
    const updated: LocalAIRuntimeConfig = {
      ...runtimeConfig,
      providerType,
      modelId: selectedModelId.trim(),
      endpointUrl: endpointUrl.trim() || 'http://127.0.0.1:11434',
    };
    try {
      await onUpdateRuntimeConfig(updated);
      await onConnectModel(updated);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchToVerifiedAlternative = async (altId: string) => {
    setSelectedModelId(altId);
    setProviderType('transformers_js_browser');
    setIsConnecting(true);
    const updated: LocalAIRuntimeConfig = {
      ...runtimeConfig,
      providerType: 'transformers_js_browser',
      modelId: altId,
      endpointUrl: endpointUrl.trim() || 'http://127.0.0.1:11434',
    };
    try {
      await onUpdateRuntimeConfig(updated);
      await onConnectModel(updated);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRunCustomPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTestPrompt.trim() || modelStatus.status !== 'ready') return;
    setIsRunningCustomTest(true);
    try {
      await onRunLiveInferenceTest(customTestPrompt.trim());
    } finally {
      setIsRunningCustomTest(false);
    }
  };

  const handleClearCache = async () => {
    await onClearModelCache();
    setCacheNotice(
      'Cleared cached ONNX model weights from Browser Cache Storage (transformers-cache).'
    );
  };

  const isBusy =
    isConnecting ||
    modelStatus.status === 'downloading' ||
    modelStatus.status === 'loading' ||
    modelStatus.status === 'verifying';

  return (
    <div className="space-y-6">
      {/* Honesty & Architecture Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.modelSetup.title}</h1>
          <p className="text-xs text-slate-600 mt-1">{t.modelSetup.subtitle}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-700 leading-relaxed">
            {t.modelSetup.honestyBanner}
          </p>
        </div>

        {/* Three Independent Offline Pillars */}
        <div>
          <h2 className="text-xs font-semibold text-slate-900 mb-3">
            {t.modelSetup.threePillarsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  {t.modelSetup.pillarShell}
                </span>
                <WifiOff className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-emerald-700 font-medium">
                {swRegistered
                  ? '● Service Worker Active'
                  : '● Browser Local Session Ready'}
              </p>
              <p className="text-[11px] text-slate-500">
                Caches HTML, CSS, JS, and UI icons so the interface loads without internet.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  {t.modelSetup.pillarMaterials}
                </span>
                <HardDrive className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-xs text-emerald-700 font-medium tabular-nums">
                ● {passagesCount} Passages Indexed Locally
              </p>
              <p className="text-[11px] text-slate-500">
                Provides offline textbook definitions, formulas, and practice questions in IndexedDB.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  {t.modelSetup.pillarModel}
                </span>
                <Cpu className="w-4 h-4 text-amber-600" />
              </div>
              <p
                className={`text-xs font-semibold uppercase font-mono ${
                  modelStatus.status === 'ready'
                    ? 'text-emerald-700'
                    : 'text-amber-800'
                }`}
              >
                {modelStatus.status === 'ready'
                  ? `● READY (${modelStatus.modelId})`
                  : `▲ ${modelStatus.status.replace('_', ' ')}`}
              </p>
              <p className="text-[11px] text-slate-500">
                Executes ONNX Gemma weights on-device via WebGPU or CPU WebAssembly (stored in Browser Cache API).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Runtime Selection, Hardware Probing & Download/Self-Test Controls */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {t.modelSetup.webGpuDiagnostics}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a Gemma model below to inspect its hardware requirements, verify compatibility, download weights to Browser Cache Storage, and run a mandatory self-test.
            </p>
          </div>

          {modelStatus.cachedModelFilesCount > 0 && (
            <button
              type="button"
              onClick={handleClearCache}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Clear Cached Weights ({modelStatus.cachedModelFilesCount} files)
              </span>
            </button>
          )}
        </div>

        {cacheNotice && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
            {cacheNotice}
          </div>
        )}

        {/* Hardware & Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-slate-500">Current LocalAIProvider Status</p>
            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
              {modelStatus.status === 'ready' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="uppercase font-mono">{modelStatus.status}</span>
            </p>
            <p className="text-slate-600 truncate">
              Backend:{' '}
              <span className="font-mono font-medium">
                {modelStatus.executionBackend}
              </span>
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-slate-500">Browser WebGPU & WASM Support</p>
            <p className="font-semibold text-slate-900">
              {modelStatus.webGpuSupported
                ? 'Hardware WebGPU Active'
                : 'CPU WebAssembly (wasm) Active'}
            </p>
            <p className="text-[11px] text-slate-600 leading-snug">
              {modelStatus.webGpuAdapterInfo ||
                'WebAssembly SIMD enabled for local CPU ONNX execution'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-slate-500">Browser Model Weight Cache</p>
            <p className="font-semibold text-slate-900 flex items-center gap-1.5 tabular-nums">
              <Database className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>
                {modelStatus.cachedModelFilesCount} Cached ONNX Artifacts
              </span>
            </p>
            <p className="text-[11px] text-slate-600">
              Stored in <code className="font-mono">Cache Storage (transformers-cache)</code> for offline reuse.
            </p>
          </div>
        </div>

        {/* Download & Verification Progress Bar */}
        {(modelStatus.status === 'downloading' ||
          modelStatus.status === 'loading' ||
          modelStatus.status === 'verifying') && (
          <div
            role="status"
            className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-sky-950">
              <span className="font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                {modelStatus.status === 'downloading' &&
                  'Downloading quantized ONNX weights to Browser Cache Storage...'}
                {modelStatus.status === 'loading' &&
                  'Compiling ONNX graph into WebAssembly / WebGPU memory...'}
                {modelStatus.status === 'verifying' &&
                  'Running mandatory live inference self-test before reporting READY...'}
              </span>
              {modelStatus.downloadProgressPercent !== null && (
                <span className="font-mono font-bold tabular-nums">
                  {modelStatus.downloadProgressPercent}%
                </span>
              )}
            </div>

            <div className="w-full h-2 bg-sky-200/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 transition-all duration-200"
                style={{
                  width: `${Math.max(
                    8,
                    modelStatus.downloadProgressPercent ?? 50
                  )}%`,
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-sky-800">
              <span>{modelStatus.activeDownloadFile || modelStatus.modelId}</span>
              {modelStatus.downloadedBytes !== null &&
                modelStatus.totalBytes !== null && (
                  <span className="tabular-nums">
                    {formatBytesToMB(modelStatus.downloadedBytes)} /{' '}
                    {formatBytesToMB(modelStatus.totalBytes)}
                  </span>
                )}
            </div>
          </div>
        )}

        {/* Exact Hardware / Runtime Blocker Banner (Requirement 14) */}
        {modelStatus.blockerReason && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-bold text-sm text-amber-950">
                  Hardware / Runtime Compatibility Blocker Detected
                </p>
                <p className="leading-relaxed">{modelStatus.blockerReason}</p>
                {modelStatus.errorMessage && (
                  <p className="text-amber-800 leading-relaxed">
                    {modelStatus.errorMessage}
                  </p>
                )}
              </div>
            </div>

            {modelStatus.recommendedAlternativeModelId && (
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    handleSwitchToVerifiedAlternative(
                      modelStatus.recommendedAlternativeModelId!
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    Switch & Load Verified Alternative (
                    {modelStatus.recommendedAlternativeModelId})
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Non-blocker Runtime Error Banner */}
        {!modelStatus.blockerReason && modelStatus.errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5"
          >
            <HelpCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Runtime Diagnostic Report</p>
              <p className="mt-0.5 leading-relaxed">{modelStatus.errorMessage}</p>
            </div>
          </div>
        )}

        {/* Model Selection Form & Selected Model Requirements */}
        <form
          onSubmit={handleLoadAndVerify}
          className="space-y-4 pt-3 border-t border-slate-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="gemma-model-select"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Select Target Local Gemma Model
              </label>
              <select
                id="gemma-model-select"
                value={selectedModelId}
                onChange={(e) => handleSelectModelChange(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              >
                {LOCAL_GEMMA_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="runtime-endpoint-url"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Local HTTP Endpoint (Only used for Ollama Desktop mode)
              </label>
              <input
                id="runtime-endpoint-url"
                type="text"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                disabled={providerType === 'transformers_js_browser'}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Selected Model Specifications Table */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 font-mono">
                {selectedSpec.id}
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                License: {selectedSpec.licenseName}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedSpec.description}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <p className="text-[11px] text-slate-500">Architecture</p>
                <p className="font-semibold text-slate-900 mt-0.5 truncate">
                  {selectedSpec.architecture.split('(')[0]}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <p className="text-[11px] text-slate-500">Download Size</p>
                <p className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                  ~{selectedSpec.approximateDownloadMB} MB ({selectedSpec.quantization})
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <p className="text-[11px] text-slate-500">Minimum RAM</p>
                <p className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                  {selectedSpec.minimumRamGB} GB RAM
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <p className="text-[11px] text-slate-500">GPU Requirement</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedSpec.requiresHardwareWebGPU
                    ? 'Hardware WebGPU Required'
                    : 'Runs on CPU WASM or WebGPU'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
              <span>
                {isBusy
                  ? 'Downloading & Verifying Model...'
                  : 'Download / Load & Verify Local Gemma Model'}
              </span>
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                onProbeCompatibility({
                  ...runtimeConfig,
                  providerType,
                  modelId: selectedModelId,
                  endpointUrl,
                })
              }
              className="px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Check Compatibility Only
            </button>

            {modelStatus.status === 'ready' && (
              <button
                type="button"
                onClick={onDisconnectModel}
                className="px-3.5 py-2.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                {t.modelSetup.unloadModelButton}
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Mandatory Self-Test Result & Live On-Device Prompt Tester */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Live Local Gemma Verification & Prompt Tester
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The UI never reports READY until a real on-device inference test succeeds. You can also test custom prompts below.
            </p>
          </div>
          {modelStatus.lastSelfTestLatencyMs !== null && (
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md tabular-nums">
              Verified Inference Latency: {modelStatus.lastSelfTestLatencyMs} ms
            </span>
          )}
        </div>

        {modelStatus.lastSelfTestOutput ? (
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs">
            <p className="text-slate-600">
              <strong className="text-slate-900">Test Prompt:</strong>{' '}
              <span className="font-mono">{modelStatus.lastSelfTestPrompt}</span>
            </p>
            <p className="text-slate-800 leading-relaxed">
              <strong className="text-emerald-950">
                Actual Local Gemma Output ({modelStatus.modelId}):
              </strong>{' '}
              {modelStatus.lastSelfTestOutput}
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
            No live inference test has been executed in this session yet. Click &ldquo;Download / Load & Verify Local Gemma Model&rdquo; above to load the model and run the self-test.
          </div>
        )}

        <form onSubmit={handleRunCustomPrompt} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            aria-label="Custom test prompt for local Gemma model"
            value={customTestPrompt}
            onChange={(e) => setCustomTestPrompt(e.target.value)}
            disabled={modelStatus.status !== 'ready' || isRunningCustomTest}
            placeholder="Enter a prompt to test local Gemma inference directly..."
            className="flex-1 min-w-[240px] px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={modelStatus.status !== 'ready' || isRunningCustomTest}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>
              {isRunningCustomTest
                ? 'Running Local Inference...'
                : 'Run Prompt on Loaded Model'}
            </span>
          </button>
        </form>
      </section>

      {/* Limitations, Licensing & Offline vs. Online Operations Documentation (Requirement 13 & Final Matrix) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Runtime Limitations, Model Licensing & Offline Capabilities Matrix
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-semibold text-slate-900">
              1. Browser Support, RAM & Gemma 4 vs. Gemma 3 Blocker
            </h3>
            <p className="leading-relaxed">
              <strong>Gemma 4 E2B IT ONNX</strong> (<code className="font-mono">Gemma4ForConditionalGeneration</code>) uses 4 multimodal sub-graphs totaling <strong>3.22 GB</strong> (<code className="font-mono">q4f16</code>). Without a physical WebGPU adapter (<code className="font-mono">navigator.gpu.requestAdapter() !== null</code>), 32-bit browser WebAssembly (<code className="font-mono">wasm32</code>) cannot allocate &gt;2 GB per ArrayBuffer. Therefore, on CPU-only browsers, the app automatically recommends and runs <strong>Gemma 3 270M IT ONNX</strong> (<strong>308 MB q4</strong>), which executes reliably in both WebGPU and CPU WebAssembly.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-semibold text-slate-900">
              2. Device Performance, Storage & Model Licensing
            </h3>
            <p className="leading-relaxed">
              On CPU WebAssembly, <code className="font-mono">gemma-3-270m-it-ONNX</code> generates ~15–25 tokens/sec (~3–5 seconds per structured explanation); with hardware WebGPU it reaches 50+ tokens/sec. Model weights are never bundled in JS—they are fetched once and persisted in the browser&apos;s <code className="font-mono">Cache Storage (transformers-cache)</code>. <strong>Gemma 4</strong> weights are licensed under <strong>Apache 2.0</strong>; <strong>Gemma 3</strong> weights are governed by the <strong>Google Gemma Terms of Use</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
            <h3 className="font-semibold text-emerald-950 flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Operations Working 100% Offline (Internet Disconnected)</span>
            </h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1 leading-relaxed">
              <li>Loading the application shell and UI via Service Worker cache</li>
              <li>Executing local Gemma inference once model weights are cached in <code className="font-mono">transformers-cache</code></li>
              <li>Deterministic arithmetic, quadratic (<code className="font-mono">ax²+bx+c=0</code>), and linear equation verification</li>
              <li>Searching Class 10 Maths & Science passages and importing local <code className="font-mono">.txt/.md/.json</code> study notes</li>
              <li>Creating, renaming, reopening, and deleting conversations in IndexedDB</li>
              <li>Progressive Hint Ladder (Hints 1–3) & SM-2 Spaced Repetition Revision scheduling</li>
              <li>Bilingual English / Tamil interface switching and JSON backup export</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
            <h3 className="font-semibold text-amber-950 flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Operations Requiring Network Connectivity</span>
            </h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1 leading-relaxed">
              <li>First-time visit to load the initial web application HTML/JS bundle</li>
              <li>First-time download of quantized ONNX model files (~308 MB for <code className="font-mono">gemma-3-270m-it-ONNX</code>) from Hugging Face CDN into <code className="font-mono">Cache Storage</code></li>
              <li>Re-downloading model weights if the user explicitly clears the browser model cache</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
