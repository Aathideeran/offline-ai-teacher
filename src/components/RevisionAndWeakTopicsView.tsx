import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookMarked,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ChapterInfo,
  LanguageCode,
  RevisionCard,
  SavedAnswerRecord,
  SubjectId,
  TopicActivityRecord,
  UnderstandingLevel,
} from '../types';
import { TRANSLATIONS } from '../modules/i18n/translations';
import { calculateTopicProgress } from '../modules/revision/spacedRepetition';

interface RevisionDashboardProps {
  language: LanguageCode;
  cards: RevisionCard[];
  savedAnswers: SavedAnswerRecord[];
  chapters: ChapterInfo[];
  onRateCard: (
    cardId: string,
    rating: 'again' | 'hard' | 'good' | 'easy'
  ) => Promise<void>;
  onCreateCard: (params: {
    subjectId: SubjectId;
    chapterId: string;
    question: string;
    conceptOrFormula: string;
    answer: string;
  }) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onDeleteSavedAnswer: (id: string) => Promise<void>;
}

export const RevisionDashboard: React.FC<RevisionDashboardProps> = ({
  language,
  cards,
  savedAnswers,
  chapters,
  onRateCard,
  onCreateCard,
  onDeleteCard,
  onDeleteSavedAnswer,
}) => {
  const t = TRANSLATIONS[language];
  const now = new Date();
  const dueCards = cards.filter((c) => new Date(c.nextReviewAt) <= now);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Create card form state
  const [subjectId, setSubjectId] = useState<SubjectId>('math_10');
  const [chapterId, setChapterId] = useState<string>('math_10_ch3');
  const [question, setQuestion] = useState<string>('');
  const [conceptOrFormula, setConceptOrFormula] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');

  const currentDueCard = dueCards[activeCardIndex] ?? dueCards[0] ?? null;

  const handleRatingClick = async (
    rating: 'again' | 'hard' | 'good' | 'easy'
  ) => {
    if (!currentDueCard) return;
    await onRateCard(currentDueCard.id, rating);
    setIsAnswerRevealed(false);
    setActiveCardIndex(0);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    await onCreateCard({
      subjectId,
      chapterId,
      question: question.trim(),
      conceptOrFormula: conceptOrFormula.trim() || 'Core Chapter Concept',
      answer: answer.trim(),
    });
    setQuestion('');
    setConceptOrFormula('');
    setAnswer('');
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {t.revision.title}
            </h1>
            <p className="text-xs text-slate-600 mt-1">{t.revision.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.revision.createCardButton}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-500">{t.revision.dueForReview}</p>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {dueCards.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t.revision.totalCards}</p>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {cards.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">
              {t.revision.completedReviews}
            </p>
            <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
              {cards.reduce((acc, c) => acc + c.repetitions, 0)}
            </p>
          </div>
        </div>
      </section>

      {/* Create Revision Card Form */}
      {showCreateForm && (
        <section
          aria-label={t.revision.createCardButton}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
        >
          <h2 className="text-base font-bold text-slate-900 mb-4">
            {t.revision.createCardButton}
          </h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rev-subject"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.doubt.selectSubject}
                </label>
                <select
                  id="rev-subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value as SubjectId)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="math_10">{t.subjects.math_10}</option>
                  <option value="science_10">{t.subjects.science_10}</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="rev-chapter"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.doubt.selectChapter}
                </label>
                <select
                  id="rev-chapter"
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {chapters
                    .filter((c) => c.subjectId === subjectId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Ch {c.number}:{' '}
                        {language === 'ta' ? c.titleTa : c.titleEn}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="rev-question"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Front of Card (Question / Prompt)
              </label>
              <input
                id="rev-question"
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What is the relationship between zeroes α, β and coefficients of ax² + bx + c?"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label
                htmlFor="rev-formula"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Key Formula / Cue
              </label>
              <input
                id="rev-formula"
                type="text"
                value={conceptOrFormula}
                onChange={(e) => setConceptOrFormula(e.target.value)}
                placeholder="e.g., α + β = -b/a, α·β = c/a"
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label
                htmlFor="rev-answer"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Back of Card (Complete Explanation / Solution)
              </label>
              <textarea
                id="rev-answer"
                rows={3}
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write the concise answer you want to recall during revision..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg"
              >
                {t.library.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg"
              >
                {t.doubt.saveTitle}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Active Spaced-Repetition Flashcard Reviewer */}
      <section
        aria-label={t.revision.reviewNow}
        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-sky-600" />
          <span>{t.revision.reviewNow}</span>
        </h2>

        {!currentDueCard ? (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800">
              {t.revision.noCardsDue}
            </p>
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t.subjects[currentDueCard.subjectId]}</span>
              <span className="font-mono tabular-nums">
                Interval: {currentDueCard.intervalDays}d · Ease:{' '}
                {currentDueCard.easeFactor}
              </span>
            </div>

            <p className="text-base font-semibold text-slate-900 leading-relaxed">
              {currentDueCard.question}
            </p>

            {!isAnswerRevealed ? (
              <button
                type="button"
                onClick={() => setIsAnswerRevealed(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>{t.revision.showAnswer}</span>
              </button>
            ) : (
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
                  <p className="text-xs font-mono font-semibold text-sky-800">
                    {currentDueCard.conceptOrFormula}
                  </p>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {currentDueCard.answer}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRatingClick('again')}
                    className="px-3.5 py-2 text-xs font-semibold text-red-800 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    {t.revision.rateAgain}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRatingClick('hard')}
                    className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                  >
                    {t.revision.rateHard}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRatingClick('good')}
                    className="px-3.5 py-2 text-xs font-semibold text-sky-900 bg-sky-100 hover:bg-sky-200 rounded-lg transition-colors"
                  >
                    {t.revision.rateGood}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRatingClick('easy')}
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                  >
                    {t.revision.rateEasy}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Saved Explanations Section */}
      {savedAnswers.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            {t.revision.savedExplanationsTitle} ({savedAnswers.length})
          </h2>
          <div className="space-y-3">
            {savedAnswers.map((sa) => (
              <div
                key={sa.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">
                    {t.subjects[sa.subjectId]} ·{' '}
                    {new Date(sa.savedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {sa.question}
                  </p>
                  <p className="text-xs font-mono font-semibold text-sky-900">
                    {sa.finalAnswer}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Delete saved explanation ${sa.question}`}
                  onClick={() => onDeleteSavedAnswer(sa.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Stored Cards Table */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          {t.revision.allSavedCards} ({cards.length})
        </h2>
        <div className="space-y-3">
          {cards.map((card) => {
            const isDue = new Date(card.nextReviewAt) <= now;
            return (
              <div
                key={card.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="space-y-1 flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {t.subjects[card.subjectId]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3" />
                      {isDue
                        ? 'Due Now'
                        : `Next review: ${new Date(
                            card.nextReviewAt
                          ).toLocaleDateString()}`}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {card.question}
                  </p>
                  <p className="text-xs font-mono text-slate-600">
                    {card.conceptOrFormula}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Delete revision card ${card.question}`}
                  onClick={() => onDeleteCard(card.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

interface WeakTopicDashboardProps {
  language: LanguageCode;
  chapters: ChapterInfo[];
  activities: TopicActivityRecord[];
  onLogQuickUnderstanding: (params: {
    subjectId: SubjectId;
    chapterId: string;
    understanding: UnderstandingLevel;
  }) => Promise<void>;
}

export const WeakTopicDashboard: React.FC<WeakTopicDashboardProps> = ({
  language,
  chapters,
  activities,
  onLogQuickUnderstanding,
}) => {
  const t = TRANSLATIONS[language];
  const progressList = calculateTopicProgress(chapters, activities);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <h1 className="text-lg font-bold text-slate-900">
          {t.weakTopics.title}
        </h1>
        <p className="text-xs text-slate-600 mt-1">{t.weakTopics.subtitle}</p>

        {/* Required Honest Assessment Disclaimer */}
        <div className="mt-4 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t.weakTopics.estimateDisclaimer}</p>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <span>{t.weakTopics.title}</span>
          </h2>
          <span className="text-xs text-slate-500 tabular-nums">
            Logs: {activities.length}
          </span>
        </div>

        <div className="space-y-3">
          {progressList.map((prog) => {
            const chapter = chapters.find((c) => c.id === prog.chapterId);
            if (!chapter) return null;

            return (
              <div
                key={prog.chapterId}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{t.subjects[chapter.subjectId]}</span>
                    <span aria-hidden="true">·</span>
                    <span>Chapter {chapter.number}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {language === 'ta' ? chapter.titleTa : chapter.titleEn}
                  </p>
                  {prog.status === 'no_activity' ? (
                    <p className="text-xs text-slate-500">
                      {t.weakTopics.noActivityYet}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 tabular-nums">
                      Estimated Readiness:{' '}
                      <strong>{prog.estimatedScorePercent}%</strong> ·{' '}
                      {t.doubt.understood}: {prog.understoodCount} ·{' '}
                      {t.doubt.partiallyUnderstood}:{' '}
                      {prog.partiallyUnderstoodCount} ·{' '}
                      {t.doubt.notUnderstood}: {prog.notUnderstoodCount}
                    </p>
                  )}
                </div>

                {/* Status Indicator + Quick Self-Check Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-xs font-semibold">
                    {prog.status === 'strong' && (
                      <span className="text-emerald-700">
                        ● {t.weakTopics.strongTopics}
                      </span>
                    )}
                    {prog.status === 'developing' && (
                      <span className="text-amber-700">
                        ▲ {t.weakTopics.developingTopics}
                      </span>
                    )}
                    {prog.status === 'needs_attention' && (
                      <span className="text-red-700">
                        ■ {t.weakTopics.needsAttention}
                      </span>
                    )}
                    {prog.status === 'no_activity' && (
                      <span className="text-slate-400">○ Unrated</span>
                    )}
                  </div>

                  <div
                    role="group"
                    aria-label={`Self-rate ${chapter.titleEn}`}
                    className="flex flex-wrap items-center gap-1"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onLogQuickUnderstanding({
                          subjectId: chapter.subjectId,
                          chapterId: chapter.id,
                          understanding: 'understood',
                        })
                      }
                      className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:bg-emerald-50 text-slate-700 rounded-md transition-colors"
                    >
                      + {t.doubt.understood}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onLogQuickUnderstanding({
                          subjectId: chapter.subjectId,
                          chapterId: chapter.id,
                          understanding: 'partially_understood',
                        })
                      }
                      className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:bg-amber-50 text-slate-700 rounded-md transition-colors"
                    >
                      + {t.doubt.partiallyUnderstood}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onLogQuickUnderstanding({
                          subjectId: chapter.subjectId,
                          chapterId: chapter.id,
                          understanding: 'not_understood',
                        })
                      }
                      className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:bg-red-50 text-slate-700 rounded-md transition-colors"
                    >
                      + {t.doubt.notUnderstood}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
