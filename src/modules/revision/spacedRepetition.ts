import {
  ChapterInfo,
  RevisionCard,
  TopicActivityRecord,
  TopicProgressEstimate,
} from '../../types';

/**
 * Schedules the next spaced-repetition review for a revision card
 * based on student recall rating ('again' | 'hard' | 'good' | 'easy').
 */
export function scheduleNextCardReview(
  card: RevisionCard,
  rating: 'again' | 'hard' | 'good' | 'easy',
  nowDate: Date = new Date()
): RevisionCard {
  let intervalDays = card.intervalDays;
  let easeFactor = card.easeFactor;
  let repetitions = card.repetitions;

  if (rating === 'again') {
    repetitions = 0;
    intervalDays = 0.5; // Review again within 12 hours
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 'hard') {
    repetitions += 1;
    intervalDays = Math.max(1, Math.round(intervalDays * 1.4));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === 'good') {
    repetitions += 1;
    intervalDays = repetitions === 1 ? 2 : Math.max(3, Math.round(intervalDays * easeFactor));
  } else if (rating === 'easy') {
    repetitions += 1;
    intervalDays = repetitions === 1 ? 4 : Math.max(7, Math.round(intervalDays * easeFactor * 1.3));
    easeFactor = Math.min(3.0, easeFactor + 0.15);
  }

  const nextReviewMs = nowDate.getTime() + intervalDays * 24 * 60 * 60 * 1000;

  return {
    ...card,
    intervalDays: Number(intervalDays.toFixed(1)),
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    lastRating: rating,
    nextReviewAt: new Date(nextReviewMs).toISOString(),
  };
}

/**
 * Calculates chapter-level weak-topic progress estimates from recorded learning activity.
 * Clearly distinguishes 'no_activity' from 'needs_attention', 'developing', and 'strong'.
 */
export function calculateTopicProgress(
  chapters: ChapterInfo[],
  activities: TopicActivityRecord[]
): TopicProgressEstimate[] {
  return chapters.map((ch) => {
    const records = activities.filter((a) => a.chapterId === ch.id);
    const totalInteractions = records.length;

    if (totalInteractions === 0) {
      return {
        subjectId: ch.subjectId,
        chapterId: ch.id,
        totalInteractions: 0,
        understoodCount: 0,
        partiallyUnderstoodCount: 0,
        notUnderstoodCount: 0,
        estimatedScorePercent: 0,
        status: 'no_activity',
        lastActiveAt: null,
      };
    }

    const understoodCount = records.filter((r) => r.understanding === 'understood').length;
    const partiallyUnderstoodCount = records.filter(
      (r) => r.understanding === 'partially_understood'
    ).length;
    const notUnderstoodCount = records.filter(
      (r) => r.understanding === 'not_understood'
    ).length;

    const weightedSum =
      understoodCount * 100 + partiallyUnderstoodCount * 55 + notUnderstoodCount * 10;
    const estimatedScorePercent = Math.round(weightedSum / totalInteractions);

    let status: TopicProgressEstimate['status'] = 'developing';
    if (estimatedScorePercent >= 75) {
      status = 'strong';
    } else if (estimatedScorePercent < 50 || notUnderstoodCount > understoodCount) {
      status = 'needs_attention';
    }

    const sortedByDate = [...records].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      subjectId: ch.subjectId,
      chapterId: ch.id,
      totalInteractions,
      understoodCount,
      partiallyUnderstoodCount,
      notUnderstoodCount,
      estimatedScorePercent,
      status,
      lastActiveAt: sortedByDate[0]?.timestamp ?? null,
    };
  });
}
