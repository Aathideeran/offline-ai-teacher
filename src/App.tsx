/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Check,
  Circle,
  Cpu,
  Download,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  AppSettings,
  ChatMessage,
  Conversation,
  ExplanationLevel,
  LocalAIRuntimeConfig,
  LocalAIStatusSnapshot,
  PracticeQuestion,
  RevisionCard,
  SavedAnswerRecord,
  StudyDocument,
  SubjectId,
  SyllabusPassage,
  TopicActivityRecord,
  UnderstandingLevel,
} from './types';
import { TRANSLATIONS } from './modules/i18n/translations';
import {
  CLASS_10_CHAPTERS,
  INITIAL_PRACTICE_QUESTIONS,
  INITIAL_REVISION_CARDS,
  INITIAL_STUDY_DOCUMENTS,
  INITIAL_SYLLABUS_PASSAGES,
} from './modules/syllabus/seedData';
import {
  clearAllConversations,
  clearUserImportedDocuments,
  computeStorageBreakdown,
  DEFAULT_APP_SETTINGS,
  deleteConversationById,
  deleteRevisionCard,
  deleteSavedAnswerById,
  deleteStudyDocumentAndPassages,
  initializeLocalDatabase,
  saveAnswerRecord,
  saveAppSettings,
  saveConversation,
  savePracticeQuestion,
  saveRevisionCard,
  saveStudyDocumentAndPassages,
  saveTopicActivity,
} from './modules/storage/indexedDB';
import {
  GemmaLocalRuntimeAdapter,
  solveStudentDoubtLocally,
} from './modules/ai/localAIProvider';
import { inspectAndChunkStudyDocument } from './modules/syllabus/retrievalEngine';
import { scheduleNextCardReview } from './modules/revision/spacedRepetition';
import {
  useOnlineStatus,
  usePWAInstall,
  useServiceWorkerShell,
} from './modules/pwa/usePWA';
import { DoubtSolverWorkspace } from './components/DoubtSolverWorkspace';
import { SyllabusLibraryView } from './components/SyllabusLibraryView';
import {
  RevisionDashboard,
  WeakTopicDashboard,
} from './components/RevisionAndWeakTopicsView';
import {
  ModelSetupView,
  PracticeWorkspace,
} from './components/PracticeAndModelSetupView';
import { SettingsAndStorageView } from './components/SettingsAndStorageView';

export type NavSectionId =
  | 'doubt_solver'
  | 'syllabus_library'
  | 'revision'
  | 'weak_topics'
  | 'practice'
  | 'model_setup'
  | 'settings';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSectionId>('doubt_solver');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Persistent state backed by IndexedDB
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswerRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [documents, setDocuments] = useState<StudyDocument[]>(
    INITIAL_STUDY_DOCUMENTS
  );
  const [passages, setPassages] = useState<SyllabusPassage[]>(
    INITIAL_SYLLABUS_PASSAGES
  );
  const [revisionCards, setRevisionCards] = useState<RevisionCard[]>(
    INITIAL_REVISION_CARDS
  );
  const [topicActivities, setTopicActivities] = useState<TopicActivityRecord[]>(
    []
  );
  const [practiceQuestions, setPracticeQuestions] = useState<
    PracticeQuestion[]
  >(INITIAL_PRACTICE_QUESTIONS);

  // Local AI Provider Adapter instance
  const aiProviderRef = useRef<GemmaLocalRuntimeAdapter>(
    new GemmaLocalRuntimeAdapter()
  );
  const [modelStatus, setModelStatus] = useState<LocalAIStatusSnapshot>(() =>
    aiProviderRef.current.getStatusSnapshot()
  );

  // PWA & Offline Status hooks
  const isOnline = useOnlineStatus();
  const { swRegistered } = useServiceWorkerShell();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    initializeLocalDatabase()
      .then(async (data) => {
        if (!mounted) return;
        setConversations(data.conversations);
        setSavedAnswers(data.savedAnswers);
        if (data.conversations.length > 0) {
          setActiveConversationId(data.conversations[0].id);
        }
        setDocuments(data.documents);
        setPassages(data.passages);
        setRevisionCards(data.revisionCards);
        setTopicActivities(data.topicActivities);
        setPracticeQuestions(data.practiceQuestions);
        setSettings(data.settings);
        setIsLoaded(true);

        const snap = await aiProviderRef.current.probeCompatibility(
          data.settings.runtimeConfig
        );
        if (mounted) {
          setModelStatus(snap);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const t = TRANSLATIONS[settings.language];

  // Handlers for Doubt Solver
  const handleSubmitDoubt = async (params: {
    question: string;
    mathExpression: string;
    subjectId: SubjectId;
    chapterId: string;
    explanationLevel: ExplanationLevel;
    startWithHint: boolean;
  }) => {
    const nowIso = new Date().toISOString();
    const studentMsg: ChatMessage = {
      id: `msg_stu_${Date.now()}`,
      role: 'student',
      content: params.question,
      mathExpression: params.mathExpression || undefined,
      timestamp: nowIso,
      subjectId: params.subjectId,
      chapterId: params.chapterId,
      explanationLevel: params.explanationLevel,
      revealedHintStage: 0,
    };

    const structuredAnswer = await solveStudentDoubtLocally({
      provider: aiProviderRef.current,
      question: params.question,
      mathExpression: params.mathExpression,
      subjectId: params.subjectId,
      chapterId: params.chapterId,
      explanationLevel: params.explanationLevel,
      allPassages: passages,
      practiceBank: practiceQuestions,
    });

    const assistantMsg: ChatMessage = {
      id: `msg_ast_${Date.now() + 1}`,
      role: 'assistant',
      content: structuredAnswer.finalAnswer,
      timestamp: new Date(Date.now() + 10).toISOString(),
      subjectId: params.subjectId,
      chapterId: params.chapterId,
      explanationLevel: params.explanationLevel,
      structuredAnswer,
      revealedHintStage: params.startWithHint ? 1 : 4,
    };

    let updatedConv: Conversation;
    const existing = conversations.find((c) => c.id === activeConversationId);

    if (existing) {
      updatedConv = {
        ...existing,
        subjectId: params.subjectId,
        chapterId: params.chapterId,
        explanationLevel: params.explanationLevel,
        updatedAt: nowIso,
        messages: [...existing.messages, studentMsg, assistantMsg],
      };
      setConversations((prev) => [
        updatedConv,
        ...prev.filter((c) => c.id !== existing.id),
      ]);
    } else {
      updatedConv = {
        id: `conv_${Date.now()}`,
        title: params.question.slice(0, 64),
        subjectId: params.subjectId,
        chapterId: params.chapterId,
        explanationLevel: params.explanationLevel,
        createdAt: nowIso,
        updatedAt: nowIso,
        messages: [studentMsg, assistantMsg],
      };
      setConversations((prev) => [updatedConv, ...prev]);
      setActiveConversationId(updatedConv.id);
    }

    await saveConversation(updatedConv).catch(() => {});
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;
    const updated: Conversation = {
      ...target,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    await saveConversation(updated).catch(() => {});
  };

  const handleRevealHintStage = async (
    conversationId: string,
    messageId: string,
    stage: 1 | 2 | 3 | 4
  ) => {
    const target = conversations.find((c) => c.id === conversationId);
    if (!target) return;

    const updated: Conversation = {
      ...target,
      messages: target.messages.map((m) =>
        m.id === messageId ? { ...m, revealedHintStage: stage } : m
      ),
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? updated : c))
    );
    await saveConversation(updated).catch(() => {});
  };

  const handleRateUnderstanding = async (
    conversationId: string,
    messageId: string,
    rating: UnderstandingLevel
  ) => {
    const target = conversations.find((c) => c.id === conversationId);
    if (!target) return;

    const targetMsg = target.messages.find((m) => m.id === messageId);
    const updated: Conversation = {
      ...target,
      messages: target.messages.map((m) =>
        m.id === messageId ? { ...m, understandingRating: rating } : m
      ),
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? updated : c))
    );
    await saveConversation(updated).catch(() => {});

    const resolvedChapterId =
      targetMsg?.chapterId && targetMsg.chapterId !== 'all'
        ? targetMsg.chapterId
        : CLASS_10_CHAPTERS.find((c) => c.subjectId === target.subjectId)?.id ||
          'math_10_ch3';

    const activity: TopicActivityRecord = {
      id: `act_${Date.now()}`,
      subjectId: target.subjectId,
      chapterId: resolvedChapterId,
      questionSnippet: target.title,
      understanding: rating,
      timestamp: new Date().toISOString(),
      source: 'doubt_solver',
    };

    setTopicActivities((prev) => [activity, ...prev]);
    await saveTopicActivity(activity).catch(() => {});
  };

  const handleSaveToRevision = async (
    conversationId: string,
    messageId: string
  ) => {
    const target = conversations.find((c) => c.id === conversationId);
    if (!target) return;
    const msg = target.messages.find((m) => m.id === messageId);
    if (!msg || !msg.structuredAnswer || msg.savedToRevision) return;

    const now = new Date().toISOString();
    const resolvedChapter =
      msg.chapterId === 'all' ? 'math_10_ch3' : msg.chapterId;

    // 1. Save as Revision Card for Spaced Repetition
    const newCard: RevisionCard = {
      id: `rev_${Date.now()}`,
      subjectId: msg.subjectId,
      chapterId: resolvedChapter,
      question: msg.structuredAnswer.whatQuestionAsks,
      conceptOrFormula: msg.structuredAnswer.conceptOrFormula.slice(0, 140),
      answer: `${msg.structuredAnswer.finalAnswer} — ${msg.structuredAnswer.stepByStepReasoning.join(' ')}`,
      sourceConversationId: conversationId,
      createdAt: now,
      nextReviewAt: now,
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
    };

    setRevisionCards((prev) => [newCard, ...prev]);
    await saveRevisionCard(newCard).catch(() => {});

    // 2. Save in Saved Answers IndexedDB store
    const savedRecord: SavedAnswerRecord = {
      id: `saved_${Date.now()}`,
      conversationId,
      messageId,
      subjectId: msg.subjectId,
      chapterId: resolvedChapter,
      question: target.title,
      finalAnswer: msg.structuredAnswer.finalAnswer,
      conceptOrFormula: msg.structuredAnswer.conceptOrFormula,
      stepByStepReasoning: msg.structuredAnswer.stepByStepReasoning,
      savedAt: now,
    };

    setSavedAnswers((prev) => [savedRecord, ...prev]);
    await saveAnswerRecord(savedRecord).catch(() => {});

    // 3. Mark message as saved
    const updatedConv: Conversation = {
      ...target,
      messages: target.messages.map((m) =>
        m.id === messageId ? { ...m, savedToRevision: true } : m
      ),
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? updatedConv : c))
    );
    await saveConversation(updatedConv).catch(() => {});
  };

  const handleDeleteSavedAnswer = async (id: string) => {
    setSavedAnswers((prev) => prev.filter((s) => s.id !== id));
    await deleteSavedAnswerById(id).catch(() => {});
  };

  const handleDeleteConversation = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConversationId(remaining[0]?.id ?? null);
    }
    await deleteConversationById(id).catch(() => {});
  };

  // Handlers for Syllabus Library
  const handleImportDocument = async (params: {
    title: string;
    subjectId: SubjectId;
    className: string;
    chapterId: string;
    source: string;
    isOfficialSyllabus: boolean;
    fileName?: string;
    rawText: string;
  }) => {
    const { document, passages: newPassages } =
      inspectAndChunkStudyDocument(params);
    setDocuments((prev) => [document, ...prev]);
    if (newPassages.length > 0) {
      setPassages((prev) => [...newPassages, ...prev]);
    }
    await saveStudyDocumentAndPassages(document, newPassages).catch(() => {});
  };

  const handleDeleteDocument = async (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setPassages((prev) => prev.filter((p) => p.documentId !== docId));
    await deleteStudyDocumentAndPassages(docId, passages).catch(() => {});
  };

  // Handlers for Revision
  const handleRateCard = async (
    cardId: string,
    rating: 'again' | 'hard' | 'good' | 'easy'
  ) => {
    const target = revisionCards.find((c) => c.id === cardId);
    if (!target) return;
    const updated = scheduleNextCardReview(target, rating, new Date());
    setRevisionCards((prev) =>
      prev.map((c) => (c.id === cardId ? updated : c))
    );
    await saveRevisionCard(updated).catch(() => {});
  };

  const handleCreateCard = async (params: {
    subjectId: SubjectId;
    chapterId: string;
    question: string;
    conceptOrFormula: string;
    answer: string;
  }) => {
    const now = new Date().toISOString();
    const card: RevisionCard = {
      id: `rev_${Date.now()}`,
      subjectId: params.subjectId,
      chapterId: params.chapterId,
      question: params.question,
      conceptOrFormula: params.conceptOrFormula,
      answer: params.answer,
      createdAt: now,
      nextReviewAt: now,
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
    };
    setRevisionCards((prev) => [card, ...prev]);
    await saveRevisionCard(card).catch(() => {});
  };

  const handleDeleteCard = async (cardId: string) => {
    setRevisionCards((prev) => prev.filter((c) => c.id !== cardId));
    await deleteRevisionCard(cardId).catch(() => {});
  };

  // Handlers for Weak Topics & Practice
  const handleLogTopicActivity = async (params: {
    subjectId: SubjectId;
    chapterId: string;
    questionSnippet?: string;
    understanding: UnderstandingLevel;
  }) => {
    const record: TopicActivityRecord = {
      id: `act_${Date.now()}`,
      subjectId: params.subjectId,
      chapterId: params.chapterId,
      questionSnippet: params.questionSnippet || 'Self-check rating',
      understanding: params.understanding,
      timestamp: new Date().toISOString(),
      source: 'practice',
    };
    setTopicActivities((prev) => [record, ...prev]);
    await saveTopicActivity(record).catch(() => {});
  };

  // Handlers for Model Setup & AI Practice Generation
  const handleUpdateRuntimeConfig = async (config: LocalAIRuntimeConfig) => {
    const updated: AppSettings = {
      ...settings,
      runtimeConfig: config,
    };
    setSettings(updated);
    await saveAppSettings(updated).catch(() => {});
  };

  const handleProbeCompatibility = async (config: LocalAIRuntimeConfig) => {
    const snap = await aiProviderRef.current.probeCompatibility(config);
    setModelStatus(snap);
  };

  const handleConnectModel = async (config: LocalAIRuntimeConfig) => {
    const snap = await aiProviderRef.current.connectModel(config, (liveSnap) =>
      setModelStatus(liveSnap)
    );
    setModelStatus(snap);
  };

  const handleDisconnectModel = () => {
    aiProviderRef.current.disconnectModel();
    setModelStatus(aiProviderRef.current.getStatusSnapshot());
  };

  const handleRunLiveInferenceTest = async (promptText: string) => {
    await aiProviderRef.current.runLiveInferenceTest(promptText, (liveSnap) =>
      setModelStatus(liveSnap)
    );
    setModelStatus(aiProviderRef.current.getStatusSnapshot());
  };

  const handleClearModelCache = async () => {
    await aiProviderRef.current.clearBrowserModelCache();
    setModelStatus(aiProviderRef.current.getStatusSnapshot());
  };

  const handleGenerateAIPracticeQuestion = async (
    subjectId: SubjectId
  ): Promise<boolean> => {
    const subjectPassages = passages.filter((p) => p.subjectId === subjectId);
    const chosenPassage =
      subjectPassages[Math.floor(Math.random() * subjectPassages.length)] ??
      passages[0];
    if (!chosenPassage) return false;

    const generated =
      await aiProviderRef.current.generatePracticeQuestionWithModel({
        subjectId,
        chapterTitle: chosenPassage.chapterTitle,
        passageExcerpt: chosenPassage.content,
      });

    if (!generated) return false;
    setPracticeQuestions((prev) => [generated, ...prev]);
    await savePracticeQuestion(generated).catch(() => {});
    return true;
  };

  // Handlers for Settings & Storage
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveAppSettings(newSettings).catch(() => {});
  };

  const handleClearConversations = async () => {
    setConversations([]);
    setActiveConversationId(null);
    await clearAllConversations().catch(() => {});
  };

  const handleClearImportedDocs = async () => {
    await clearUserImportedDocuments(documents, passages).catch(() => {});
    const builtInDocIds = new Set(
      documents.filter((d) => d.isBuiltIn).map((d) => d.id)
    );
    setDocuments((prev) => prev.filter((d) => d.isBuiltIn));
    setPassages((prev) => prev.filter((p) => builtInDocIds.has(p.documentId)));
  };

  const handleExportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      appName: 'Offline AI Doubt Solver',
      settings,
      conversations,
      savedAnswers,
      documents,
      passages,
      revisionCards,
      topicActivities,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline-doubt-solver-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const storageBreakdown = computeStorageBreakdown({
    conversations,
    savedAnswers,
    documents,
    passages,
    revisionCards,
    topicActivities,
    practiceQuestions,
  });

  const navItems: {
    id: NavSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[] = [
    { id: 'doubt_solver', label: t.nav.doubtSolver, icon: MessageSquare },
    {
      id: 'syllabus_library',
      label: t.nav.syllabusLibrary,
      icon: BookOpen,
      badge: passages.length,
    },
    {
      id: 'revision',
      label: t.nav.revision,
      icon: BookMarked,
      badge: revisionCards.filter((c) => new Date(c.nextReviewAt) <= new Date())
        .length,
    },
    { id: 'weak_topics', label: t.nav.weakTopics, icon: BarChart3 },
    {
      id: 'practice',
      label: t.nav.practice,
      icon: HelpCircle,
      badge: practiceQuestions.length,
    },
    { id: 'model_setup', label: t.nav.modelSetup, icon: Cpu },
    { id: 'settings', label: t.nav.settingsStorage, icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 clean zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-8">
        {/* Zone 1: Single wordmark element */}
        <a
          href="#doubt-solver"
          onClick={(e) => {
            e.preventDefault();
            setActiveNav('doubt_solver');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <GraduationCap className="w-5 h-5 text-sky-600 shrink-0" />
          <span>{t.appName}</span>
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden xl:flex items-center gap-6 text-xs font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => setActiveNav('doubt_solver')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'doubt_solver'
                ? 'text-slate-900 font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            {t.nav.doubtSolver}
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('syllabus_library')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'syllabus_library'
                ? 'text-slate-900 font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            {t.nav.syllabusLibrary}
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('revision')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'revision'
                ? 'text-slate-900 font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            {t.nav.revision}
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('weak_topics')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'weak_topics'
                ? 'text-slate-900 font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            {t.nav.weakTopics}
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('practice')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'practice'
                ? 'text-slate-900 font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            {t.nav.practice}
          </button>
        </nav>

        {/* Zone 3: 1 primary action (Language Switcher / Install App) */}
        <div className="flex items-center gap-3 shrink-0">
          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={install}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.status.installApp}</span>
            </button>
          )}
          {!isInstalled && !isInstallable && isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.status.installApp}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              handleUpdateSettings({
                ...settings,
                language: settings.language === 'en' ? 'ta' : 'en',
              })
            }
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {settings.language === 'en' ? 'தமிழ் (Tamil)' : 'English'}
          </button>
        </div>
      </header>

      {/* Sub-header Offline & Model Status Bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            {isOnline ? t.status.online : t.status.offline}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.status.materialsLoaded}:{' '}
            <strong className="font-mono tabular-nums text-slate-900">
              {passages.length}
            </strong>{' '}
            passages ({documents.length} docs)
          </span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setActiveNav('model_setup')}
            className="hover:underline text-left"
          >
            AI Runtime:{' '}
            <strong className="text-slate-900">
              {modelStatus.status === 'ready'
                ? `${t.status.modelReady} (${modelStatus.modelId})`
                : modelStatus.status === 'downloading'
                  ? `Downloading Model (${modelStatus.downloadProgressPercent ?? 0}%)`
                  : modelStatus.status === 'loading'
                    ? t.status.modelLoading
                    : modelStatus.status === 'verifying'
                      ? 'Verifying Self-Test...'
                      : modelStatus.status === 'unavailable'
                        ? t.status.modelUnavailable
                        : t.status.modelNotLoaded}
            </strong>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 hidden md:inline">
          {t.appSubtitle}
        </span>
      </div>

      {/* Mobile Horizontal Section Switcher (Visible on < md viewports so mobile content is never crushed) */}
      <nav
        aria-label="Mobile Workspace Navigation"
        className="md:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Workspace Container with Collapsible Desktop Sidebar */}
      <div className="flex-1 flex">
        {/* Collapsible Left Navigation Sidebar (Desktop >= md) */}
        <aside
          aria-label="Workspace Sections"
          className={`hidden md:flex bg-white border-r border-slate-200 shrink-0 transition-all duration-150 flex-col justify-between ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between px-2 py-1.5 mb-1">
              {!sidebarCollapsed && (
                <span className="text-[11px] font-semibold text-slate-400">
                  {t.nav.workspaceMenu}
                </span>
              )}
              <button
                type="button"
                aria-label={
                  sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        isActive ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!sidebarCollapsed && (
            <div className="p-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700">
                {t.nav.offlineReadiness}
              </p>
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>App Shell: Cached</span>
              </p>
              <p className="flex items-center gap-1.5 tabular-nums">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Syllabus: {passages.length} local passages</span>
              </p>
              <p className="flex items-center gap-1.5">
                {modelStatus.status === 'ready' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Gemma: Ready ({modelStatus.modelId.split('/').pop()})
                    </span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Gemma: {modelStatus.status.replace('_', ' ')}</span>
                  </>
                )}
              </p>
            </div>
          )}
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1360px] mx-auto w-full">
          {!isLoaded ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading local IndexedDB study workspace...
            </div>
          ) : (
            <>
              {activeNav === 'doubt_solver' && (
                <DoubtSolverWorkspace
                  language={settings.language}
                  chapters={CLASS_10_CHAPTERS}
                  conversations={conversations}
                  savedAnswers={savedAnswers}
                  activeConversationId={activeConversationId}
                  modelStatus={modelStatus}
                  preferHintFirstDefault={settings.preferHintFirst}
                  onSelectConversation={setActiveConversationId}
                  onRenameConversation={handleRenameConversation}
                  onDeleteConversation={handleDeleteConversation}
                  onDeleteSavedAnswer={handleDeleteSavedAnswer}
                  onSubmitDoubt={handleSubmitDoubt}
                  onRevealHintStage={handleRevealHintStage}
                  onRateUnderstanding={handleRateUnderstanding}
                  onSaveToRevision={handleSaveToRevision}
                />
              )}

              {activeNav === 'syllabus_library' && (
                <SyllabusLibraryView
                  language={settings.language}
                  documents={documents}
                  passages={passages}
                  chapters={CLASS_10_CHAPTERS}
                  onImportDocument={handleImportDocument}
                  onDeleteDocument={handleDeleteDocument}
                />
              )}

              {activeNav === 'revision' && (
                <RevisionDashboard
                  language={settings.language}
                  cards={revisionCards}
                  savedAnswers={savedAnswers}
                  chapters={CLASS_10_CHAPTERS}
                  onRateCard={handleRateCard}
                  onCreateCard={handleCreateCard}
                  onDeleteCard={handleDeleteCard}
                  onDeleteSavedAnswer={handleDeleteSavedAnswer}
                />
              )}

              {activeNav === 'weak_topics' && (
                <WeakTopicDashboard
                  language={settings.language}
                  chapters={CLASS_10_CHAPTERS}
                  activities={topicActivities}
                  onLogQuickUnderstanding={handleLogTopicActivity}
                />
              )}

              {activeNav === 'practice' && (
                <PracticeWorkspace
                  language={settings.language}
                  questions={practiceQuestions}
                  chapters={CLASS_10_CHAPTERS}
                  modelStatus={modelStatus}
                  onRecordPracticeAttempt={handleLogTopicActivity}
                  onGenerateAIPracticeQuestion={
                    handleGenerateAIPracticeQuestion
                  }
                />
              )}

              {activeNav === 'model_setup' && (
                <ModelSetupView
                  language={settings.language}
                  modelStatus={modelStatus}
                  runtimeConfig={settings.runtimeConfig}
                  swRegistered={swRegistered}
                  passagesCount={passages.length}
                  onUpdateRuntimeConfig={handleUpdateRuntimeConfig}
                  onProbeCompatibility={handleProbeCompatibility}
                  onConnectModel={handleConnectModel}
                  onDisconnectModel={handleDisconnectModel}
                  onRunLiveInferenceTest={handleRunLiveInferenceTest}
                  onClearModelCache={handleClearModelCache}
                />
              )}

              {activeNav === 'settings' && (
                <SettingsAndStorageView
                  language={settings.language}
                  settings={settings}
                  storageBreakdown={storageBreakdown}
                  onUpdateSettings={handleUpdateSettings}
                  onClearConversations={handleClearConversations}
                  onClearImportedDocs={handleClearImportedDocs}
                  onExportBackup={handleExportBackup}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install on iOS"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              Install Offline AI Doubt Solver on iOS
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              1. Tap the <strong>Share</strong> button in your Safari toolbar.
              <br />
              2. Scroll down and select <strong>Add to Home Screen</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
