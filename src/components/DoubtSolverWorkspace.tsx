import React, { useState } from 'react';
import {
  AlertTriangle,
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Edit3,
  HelpCircle,
  Lightbulb,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  ChapterInfo,
  ChatMessage,
  Conversation,
  ExplanationLevel,
  LanguageCode,
  LocalAIStatusSnapshot,
  SavedAnswerRecord,
  SubjectId,
  UnderstandingLevel,
} from '../types';
import { TRANSLATIONS } from '../modules/i18n/translations';

interface DoubtSolverWorkspaceProps {
  language: LanguageCode;
  chapters: ChapterInfo[];
  conversations: Conversation[];
  savedAnswers: SavedAnswerRecord[];
  activeConversationId: string | null;
  modelStatus: LocalAIStatusSnapshot;
  preferHintFirstDefault: boolean;
  onSelectConversation: (id: string | null) => void;
  onRenameConversation: (id: string, newTitle: string) => Promise<void>;
  onDeleteConversation: (id: string) => void;
  onDeleteSavedAnswer: (id: string) => Promise<void>;
  onSubmitDoubt: (params: {
    question: string;
    mathExpression: string;
    subjectId: SubjectId;
    chapterId: string;
    explanationLevel: ExplanationLevel;
    startWithHint: boolean;
  }) => Promise<void>;
  onRevealHintStage: (
    conversationId: string,
    messageId: string,
    stage: 1 | 2 | 3 | 4
  ) => void;
  onRateUnderstanding: (
    conversationId: string,
    messageId: string,
    rating: UnderstandingLevel
  ) => void;
  onSaveToRevision: (conversationId: string, messageId: string) => void;
}

const SAMPLE_DOUBTS = [
  {
    labelEn: 'Quadratic Roots: x² - 7x + 12 = 0',
    labelTa: 'இருபடிச் சமன்பாடு: x² - 7x + 12 = 0',
    subjectId: 'math_10' as SubjectId,
    chapterId: 'math_10_ch3',
    question:
      'Find the roots of the quadratic equation x^2 - 7x + 12 = 0 and state the nature of roots using the discriminant.',
    mathExpression: 'x^2 - 7x + 12 = 0',
  },
  {
    labelEn: 'Arithmetic Progression 10th Term',
    labelTa: 'கூட்டுத்தொடர் வரிசை (AP) 10-வது உறுப்பு',
    subjectId: 'math_10' as SubjectId,
    chapterId: 'math_10_ch4',
    question:
      'Find the 10th term of the Arithmetic Progression 2, 7, 12, ... using the nth term formula.',
    mathExpression: '2 + (10 - 1) * 5',
  },
  {
    labelEn: "Ohm's Law & Electric Current (V=220V, R=1100Ω)",
    labelTa: 'ஓம் விதி மற்றும் மின்னோட்டம் (V=220V, R=1100Ω)',
    subjectId: 'science_10' as SubjectId,
    chapterId: 'sci_10_ch5',
    question:
      "State Ohm's Law and calculate the current drawn from a 220 V source by a filament of resistance 1100 Ω.",
    mathExpression: '220 / 1100',
  },
  {
    labelEn: 'HCF & LCM Relation: HCF(306, 657) = 9',
    labelTa: 'மீ.பொ.வ மற்றும் மீ.சி.ம: HCF(306, 657) = 9',
    subjectId: 'math_10' as SubjectId,
    chapterId: 'math_10_ch1',
    question:
      'Given that HCF(306, 657) = 9, find LCM(306, 657) using the Fundamental Theorem of Arithmetic relationship.',
    mathExpression: 'lcm(306, 657)',
  },
];

export const DoubtSolverWorkspace: React.FC<DoubtSolverWorkspaceProps> = ({
  language,
  chapters,
  conversations,
  savedAnswers,
  activeConversationId,
  modelStatus,
  preferHintFirstDefault,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onDeleteSavedAnswer,
  onSubmitDoubt,
  onRevealHintStage,
  onRateUnderstanding,
  onSaveToRevision,
}) => {
  const t = TRANSLATIONS[language];
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  const [sidebarTab, setSidebarTab] = useState<'conversations' | 'saved'>(
    'conversations'
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState<string>('');

  const [subjectId, setSubjectId] = useState<SubjectId>(
    activeConversation?.subjectId ?? 'math_10'
  );
  const [chapterId, setChapterId] = useState<string>(
    activeConversation?.chapterId ?? 'all'
  );
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>(
    activeConversation?.explanationLevel ?? 'standard'
  );
  const [questionText, setQuestionText] = useState<string>('');
  const [mathExpression, setMathExpression] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [practiceCheckInput, setPracticeCheckInput] = useState<
    Record<string, string>
  >({});
  const [practiceCheckResult, setPracticeCheckResult] = useState<
    Record<string, 'correct' | 'incorrect' | null>
  >({});

  const availableChapters = chapters.filter((c) => c.subjectId === subjectId);

  const handleSubjectChange = (newSubject: SubjectId) => {
    setSubjectId(newSubject);
    setChapterId('all');
  };

  const handleFormSubmit = async (startWithHint: boolean) => {
    if (!questionText.trim() && !mathExpression.trim()) {
      setFormError(t.doubt.emptyQuestionError);
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await onSubmitDoubt({
        question:
          questionText.trim() || `Evaluate and explain: ${mathExpression.trim()}`,
        mathExpression: mathExpression.trim(),
        subjectId,
        chapterId,
        explanationLevel,
        startWithHint,
      });
      setQuestionText('');
      setMathExpression('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameDraft(conv.title);
  };

  const handleConfirmRename = async (id: string) => {
    if (!renameDraft.trim()) return;
    await onRenameConversation(id, renameDraft.trim());
    setRenamingId(null);
    setRenameDraft('');
    setActionBanner(
      language === 'ta'
        ? 'உரையாடலின் பெயர் மாற்றப்பட்டு சேமிக்கப்பட்டது.'
        : 'Conversation title renamed and saved to IndexedDB.'
    );
  };

  const handleLoadSample = (sample: (typeof SAMPLE_DOUBTS)[number]) => {
    setFormError(null);
    setSubjectId(sample.subjectId);
    setChapterId(sample.chapterId);
    setQuestionText(sample.question);
    setMathExpression(sample.mathExpression);
  };

  const handleCopyAnswer = (msg: ChatMessage) => {
    const ans = msg.structuredAnswer;
    if (!ans) return;
    const formatted = [
      `${t.doubt.sec1WhatQuestionAsks}: ${ans.whatQuestionAsks}`,
      `${t.doubt.sec2ConceptFormula}: ${ans.conceptOrFormula}`,
      `${t.doubt.sec3StepByStep}:\n${ans.stepByStepReasoning
        .map((s, i) => `  ${i + 1}. ${s}`)
        .join('\n')}`,
      `${t.doubt.sec4FinalAnswer}: ${ans.finalAnswer}`,
      `${t.doubt.sec5QuickVerification}: ${ans.quickVerification}`,
    ].join('\n\n');

    navigator.clipboard?.writeText(formatted).catch(() => {});
    setCopiedMessageId(msg.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSaveAnswerClick = (convId: string, msgId: string) => {
    onSaveToRevision(convId, msgId);
    setActionBanner(t.doubt.savedSuccessNotice);
  };

  const handleCheckInlinePractice = (msgId: string, expected: string) => {
    const userVal = (practiceCheckInput[msgId] || '').trim().toLowerCase();
    if (!userVal) return;
    const cleanExp = expected.trim().toLowerCase();
    const isMatch =
      userVal === cleanExp ||
      userVal.replace(/\s+/g, '') === cleanExp.replace(/\s+/g, '');
    setPracticeCheckResult((prev) => ({
      ...prev,
      [msgId]: isMatch ? 'correct' : 'incorrect',
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Stored Conversations & Saved Answers (4 cols on desktop) */}
      <aside
        aria-label={t.doubt.recentConversations}
        className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4"
      >
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSidebarTab('conversations')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                sidebarTab === 'conversations'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.doubt.recentConversations} ({conversations.length})
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('saved')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                sidebarTab === 'saved'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.doubt.savedAnswersTab} ({savedAnswers.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectConversation(null);
              setQuestionText('');
              setMathExpression('');
              setFormError(null);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>{t.doubt.newDoubtSession}</span>
          </button>
        </div>

        {sidebarTab === 'conversations' ? (
          conversations.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 leading-relaxed">
              {t.doubt.noConversationsYet}
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {conversations.map((conv) => {
                const isSelected = conv.id === activeConversationId;
                const isRenaming = renamingId === conv.id;

                return (
                  <li
                    key={conv.id}
                    className={`rounded-lg p-2.5 transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {isRenaming ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          aria-label={t.doubt.renameConversation}
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-white text-slate-900 border border-slate-300 rounded-md"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setRenamingId(null)}
                            className="px-2 py-1 text-[11px] font-medium bg-slate-200 text-slate-800 rounded"
                          >
                            {t.doubt.cancelRename}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmRename(conv.id)}
                            className="px-2 py-1 text-[11px] font-semibold bg-sky-600 text-white rounded"
                          >
                            {t.doubt.saveTitle}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectConversation(conv.id)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="text-xs font-medium truncate">
                            {conv.title}
                          </p>
                          <p
                            className={`text-[11px] mt-0.5 truncate tabular-nums ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {t.subjects[conv.subjectId]} · {conv.messages.length}{' '}
                            msgs
                          </p>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            aria-label={`${t.doubt.renameConversation} ${conv.title}`}
                            onClick={() => handleStartRename(conv)}
                            className={`p-1 rounded transition-colors ${
                              isSelected
                                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete conversation ${conv.title}`}
                            onClick={() => onDeleteConversation(conv.id)}
                            className={`p-1 rounded transition-colors ${
                              isSelected
                                ? 'text-slate-300 hover:text-red-200 hover:bg-red-500/20'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )
        ) : savedAnswers.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 leading-relaxed">
            {t.doubt.noSavedAnswersYet}
          </p>
        ) : (
          <ul className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {savedAnswers.map((sa) => (
              <li
                key={sa.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectConversation(sa.conversationId)}
                    className="text-left text-xs font-semibold text-slate-900 hover:text-sky-700 line-clamp-2"
                  >
                    {sa.question}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete saved answer ${sa.question}`}
                    onClick={() => onDeleteSavedAnswer(sa.id)}
                    className="p-1 text-slate-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs font-mono text-sky-900">
                  {sa.finalAnswer}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Quick-load sample questions */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-2">
            {t.doubt.sampleQuestionsTitle}
          </p>
          <div className="space-y-1.5">
            {SAMPLE_DOUBTS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadSample(s)}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors flex items-center justify-between gap-2"
              >
                <span className="truncate">
                  {language === 'ta' ? s.labelTa : s.labelEn}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right Column: Main Doubt-Solving Workspace (8 cols on desktop) */}
      <div className="lg:col-span-8 space-y-6">
        {actionBanner && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionBanner}</span>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setActionBanner(null)}
              className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Question Input & Controls Panel */}
        <section
          aria-label={t.doubt.workspaceTitle}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200">
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {t.doubt.workspaceTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {modelStatus.status === 'ready'
                  ? `${t.doubt.generatedByGemma} (${modelStatus.modelId})`
                  : t.doubt.generatedByLocalEngine}
              </p>
            </div>

            {/* Explanation Depth Segmented Control */}
            <div
              role="group"
              aria-label={t.doubt.explanationLevel}
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              {(
                [
                  { id: 'basic', label: t.doubt.levelBasic },
                  { id: 'standard', label: t.doubt.levelStandard },
                  { id: 'exam_prep', label: t.doubt.levelExamPrep },
                ] as const
              ).map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setExplanationLevel(lvl.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    explanationLevel === lvl.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Subject & Chapter Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="subject-select"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                {t.doubt.selectSubject}
              </label>
              <select
                id="subject-select"
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value as SubjectId)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
              >
                <option value="math_10">{t.subjects.math_10}</option>
                <option value="science_10">{t.subjects.science_10}</option>
                <option value="other">{t.subjects.other}</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="chapter-select"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                {t.doubt.selectChapter}
              </label>
              <select
                id="chapter-select"
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
              >
                <option value="all">{t.doubt.allChapters}</option>
                {availableChapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Ch {ch.number}: {language === 'ta' ? ch.titleTa : ch.titleEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Textarea */}
          <div className="mb-4">
            <label
              htmlFor="doubt-question-input"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              {activeConversation
                ? t.doubt.askFollowUpPlaceholder
                : t.doubt.yourQuestionLabel}
            </label>
            <textarea
              id="doubt-question-input"
              rows={3}
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder={t.doubt.questionPlaceholder}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
            />
          </div>

          {/* Dedicated Math Expression Input */}
          <div className="mb-5">
            <label
              htmlFor="math-expression-input"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5"
            >
              <Calculator className="w-3.5 h-3.5 text-sky-600" />
              <span>{t.doubt.mathExpressionLabel}</span>
            </label>
            <input
              id="math-expression-input"
              type="text"
              value={mathExpression}
              onChange={(e) => {
                setMathExpression(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder={t.doubt.mathExpressionPlaceholder}
              className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
            />
          </div>

          {/* Submit Buttons: Request Hint 1 First vs Full Solution */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleFormSubmit(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>{t.doubt.startWithHint}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                handleFormSubmit(preferHintFirstDefault ? true : false)
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Solving...' : t.doubt.solveFull}</span>
            </button>
          </div>
        </section>

        {/* Active Conversation Thread */}
        {activeConversation && activeConversation.messages.length > 0 && (
          <section aria-label="Conversation Responses" className="space-y-6">
            {activeConversation.messages.map((msg) => {
              if (msg.role === 'student') {
                return (
                  <div
                    key={msg.id}
                    className="bg-slate-900 text-white rounded-xl p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-300 mb-1.5">
                      <span>{activeConversation.title}</span>
                      <span className="tabular-nums">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-medium leading-relaxed">
                      {msg.content}
                    </p>
                    {msg.mathExpression && (
                      <p className="mt-2 text-xs font-mono text-sky-300">
                        Expression: {msg.mathExpression}
                      </p>
                    )}
                  </div>
                );
              }

              const ans = msg.structuredAnswer;
              if (!ans) return null;

              const stage = msg.revealedHintStage;
              const showFullSolution = stage >= 4;

              return (
                <article
                  key={msg.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6"
                >
                  {/* Top Provenance & Math Verification Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {ans.generatedBy === 'gemma_local'
                          ? `${t.doubt.generatedByGemma} (${ans.modelIdUsed}${
                              ans.inferenceLatencyMs
                                ? ` · ${ans.inferenceLatencyMs} ms`
                                : ''
                            })`
                          : t.doubt.generatedByLocalEngine}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-medium ${
                          ans.isGroundedInSyllabus
                            ? 'text-sky-800'
                            : 'text-amber-800'
                        }`}
                      >
                        {ans.isGroundedInSyllabus
                          ? `Grounded (${ans.syllabusReferences.length} syllabus passage${
                              ans.syllabusReferences.length === 1 ? '' : 's'
                            })`
                          : 'Ungrounded (No Local Syllabus Match)'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {ans.mathVerification.status === 'verified' && (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t.doubt.mathVerifiedBadge}
                          </span>
                        )}
                        {ans.mathVerification.status === 'mismatch' && (
                          <span className="inline-flex items-center gap-1 font-medium text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t.doubt.mathMismatchBadge}
                          </span>
                        )}
                        {ans.mathVerification.status ===
                          'unsupported_symbolic' && (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                            <HelpCircle className="w-3.5 h-3.5" />
                            {t.doubt.mathUnsupportedBadge}
                          </span>
                        )}
                        {ans.mathVerification.status === 'not_applicable' && (
                          <span className="text-slate-500">
                            {t.doubt.mathNotApplicableBadge}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Action buttons: Copy & Save to Revision */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyAnswer(msg)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t.doubt.copied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{t.doubt.copyAnswer}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSaveAnswerClick(activeConversation.id, msg.id)
                        }
                        disabled={msg.savedToRevision}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        {msg.savedToRevision ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t.doubt.savedToRevision}</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>{t.doubt.saveToRevision}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Ungrounded Warning Banner if outside local syllabus */}
                  {!ans.isGroundedInSyllabus && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          {t.doubt.ungroundedWarning}
                        </p>
                        {ans.ungroundedNotice && (
                          <p className="mt-0.5 text-amber-800">
                            {ans.ungroundedNotice}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progressive Hint Ladder Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <span>{t.doubt.hintLadderTitle}</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        {stage < 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              onRevealHintStage(
                                activeConversation.id,
                                msg.id,
                                (stage + 1) as 1 | 2 | 3
                              )
                            }
                            className="px-3 py-1 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                          >
                            {t.doubt.revealNextHint} ({stage + 1}/3)
                          </button>
                        )}
                        {!showFullSolution && (
                          <button
                            type="button"
                            onClick={() =>
                              onRevealHintStage(
                                activeConversation.id,
                                msg.id,
                                4
                              )
                            }
                            className="px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
                          >
                            {t.doubt.revealFullSolution}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div
                        className={`p-3 rounded-lg border text-xs ${
                          stage >= 1
                            ? 'bg-white border-slate-200 text-slate-800'
                            : 'bg-slate-100 border-slate-200/60 text-slate-400'
                        }`}
                      >
                        <p className="font-semibold text-slate-900 mb-1">
                          {t.doubt.hint1Label}
                        </p>
                        <p>
                          {stage >= 1
                            ? ans.hints.hint1Concept
                            : 'Locked — Click to reveal'}
                        </p>
                      </div>

                      <div
                        className={`p-3 rounded-lg border text-xs ${
                          stage >= 2
                            ? 'bg-white border-slate-200 text-slate-800'
                            : 'bg-slate-100 border-slate-200/60 text-slate-400'
                        }`}
                      >
                        <p className="font-semibold text-slate-900 mb-1">
                          {t.doubt.hint2Label}
                        </p>
                        <p>
                          {stage >= 2
                            ? ans.hints.hint2NextStep
                            : 'Reveal Hint 2 to see the next step'}
                        </p>
                      </div>

                      <div
                        className={`p-3 rounded-lg border text-xs ${
                          stage >= 3
                            ? 'bg-white border-slate-200 text-slate-800'
                            : 'bg-slate-100 border-slate-200/60 text-slate-400'
                        }`}
                      >
                        <p className="font-semibold text-slate-900 mb-1">
                          {t.doubt.hint3Label}
                        </p>
                        <p>
                          {stage >= 3
                            ? ans.hints.hint3Detailed
                            : 'Reveal Hint 3 for detailed setup'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Full 7-Part Structured Solution (Visible when stage === 4) */}
                  {showFullSolution && (
                    <div className="space-y-5 pt-2">
                      {/* 1 & 2: What the Question Asks + Relevant Concept/Formula */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <h4 className="text-xs font-semibold text-slate-900 mb-1.5">
                            {t.doubt.sec1WhatQuestionAsks}
                          </h4>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {ans.whatQuestionAsks}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <h4 className="text-xs font-semibold text-slate-900 mb-1.5">
                            {t.doubt.sec2ConceptFormula}
                          </h4>
                          <p className="text-sm font-mono text-slate-800 leading-relaxed">
                            {ans.conceptOrFormula}
                          </p>
                        </div>
                      </div>

                      {/* 3. Step-by-Step Reasoning */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-slate-900">
                            {t.doubt.sec3StepByStep}
                          </h4>
                          {ans.generatedBy === 'gemma_local' && (
                            <span className="text-[11px] font-mono text-emerald-700">
                              Synthesized by Local Gemma ({ans.modelIdUsed})
                            </span>
                          )}
                        </div>
                        <ol className="space-y-2 text-sm text-slate-800 list-decimal list-inside">
                          {ans.stepByStepReasoning.map((step, i) => (
                            <li key={i} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ol>
                        {ans.generatedBy === 'gemma_local' &&
                          ans.rawModelOutput && (
                            <div className="pt-2 border-t border-slate-200/80">
                              <p className="text-[11px] font-semibold text-slate-600 mb-1">
                                Raw On-Device Gemma Generation ({ans.modelIdUsed}):
                              </p>
                              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                                {ans.rawModelOutput}
                              </p>
                            </div>
                          )}
                      </div>

                      {/* 4 & 5: Final Answer + Independent Math Verification */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
                          <h4 className="text-xs font-semibold text-sky-950 mb-1.5">
                            {t.doubt.sec4FinalAnswer}
                          </h4>
                          <p className="text-base font-bold font-mono text-sky-900 tabular-nums">
                            {ans.finalAnswer}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <h4 className="text-xs font-semibold text-slate-900 mb-1.5">
                            {t.doubt.sec5QuickVerification}
                          </h4>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {ans.quickVerification}
                          </p>
                          {ans.mathVerification.verifiedResult && (
                            <p className="mt-1.5 text-xs font-mono font-semibold text-emerald-700 tabular-nums">
                              Math Engine Output:{' '}
                              {ans.mathVerification.verifiedResult}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 6. Syllabus Reference */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                          <span>{t.doubt.sec6SyllabusSource}</span>
                        </h4>
                        {ans.syllabusReferences.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No matching passage found in local syllabus storage.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {ans.syllabusReferences.map((ref, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-slate-700 pb-2 last:pb-0 border-b last:border-b-0 border-slate-200/70"
                              >
                                <p className="font-semibold text-slate-900">
                                  {ref.chapterTitle} · {ref.sectionHeading}
                                </p>
                                <p className="text-slate-500 mt-0.5">
                                  {ref.sourceLabel} ·{' '}
                                  {ref.isOfficialSyllabus
                                    ? 'User-Verified Official Syllabus'
                                    : 'Foundational Reference Note'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 7. Short Practice Question */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            <span>{t.doubt.sec7PracticeQuestion}</span>
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Source:{' '}
                            {ans.practiceQuestion.sourceType === 'imported_bank'
                              ? 'Local Question Bank'
                              : 'Practice Template'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 mb-3">
                          {ans.practiceQuestion.question}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            aria-label="Practice answer check"
                            value={practiceCheckInput[msg.id] || ''}
                            onChange={(e) =>
                              setPracticeCheckInput((prev) => ({
                                ...prev,
                                [msg.id]: e.target.value,
                              }))
                            }
                            placeholder="Type answer to check..."
                            className="px-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleCheckInlinePractice(
                                msg.id,
                                ans.practiceQuestion.answer
                              )
                            }
                            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                          >
                            Verify Practice Answer
                          </button>
                          {practiceCheckResult[msg.id] === 'correct' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                              Correct ({ans.practiceQuestion.answer})
                            </span>
                          )}
                          {practiceCheckResult[msg.id] === 'incorrect' && (
                            <span className="text-xs font-medium text-amber-800">
                              Expected: {ans.practiceQuestion.answer} (Hint:{' '}
                              {ans.practiceQuestion.hint})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer: Self-Rating for Weak-Topic Tracking */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-700">
                      {t.doubt.rateUnderstanding}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          {
                            id: 'understood',
                            label: t.doubt.understood,
                            activeCls: 'bg-emerald-600 text-white',
                          },
                          {
                            id: 'partially_understood',
                            label: t.doubt.partiallyUnderstood,
                            activeCls: 'bg-amber-600 text-white',
                          },
                          {
                            id: 'not_understood',
                            label: t.doubt.notUnderstood,
                            activeCls: 'bg-red-600 text-white',
                          },
                        ] as const
                      ).map((rate) => {
                        const isRated = msg.understandingRating === rate.id;
                        return (
                          <button
                            key={rate.id}
                            type="button"
                            onClick={() =>
                              onRateUnderstanding(
                                activeConversation.id,
                                msg.id,
                                rate.id
                              )
                            }
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                              isRated
                                ? rate.activeCls
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {rate.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
};
