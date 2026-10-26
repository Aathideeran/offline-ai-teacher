import {
  AppSettings,
  Conversation,
  PracticeQuestion,
  RevisionCard,
  SavedAnswerRecord,
  StorageBreakdown,
  StudyDocument,
  SyllabusPassage,
  TopicActivityRecord,
} from '../../types';
import {
  INITIAL_PRACTICE_QUESTIONS,
  INITIAL_REVISION_CARDS,
  INITIAL_STUDY_DOCUMENTS,
  INITIAL_SYLLABUS_PASSAGES,
} from '../syllabus/seedData';

const DB_NAME = 'OfflineAIDoubtSolverDB';
const DB_VERSION = 2;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  language: 'en',
  defaultSubjectId: 'math_10',
  defaultExplanationLevel: 'standard',
  preferHintFirst: false,
  runtimeConfig: {
    providerType: 'transformers_js_browser',
    modelId: 'onnx-community/gemma-3-270m-it-ONNX',
    endpointUrl: 'http://127.0.0.1:11434',
    temperature: 0.2,
    maxTokens: 180,
  },
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('conversations')) {
        db.createObjectStore('conversations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('saved_answers')) {
        db.createObjectStore('saved_answers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('passages')) {
        db.createObjectStore('passages', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('revision_cards')) {
        db.createObjectStore('revision_cards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('topic_activity')) {
        db.createObjectStore('topic_activity', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('practice_questions')) {
        db.createObjectStore('practice_questions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function putInStore<T>(storeName: string, item: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteFromStore(storeName: string, key: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearStore(storeName: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Initializes local storage and seeds built-in Class 10 reference study packs
 * if the database is being opened for the first time.
 */
export async function initializeLocalDatabase(): Promise<{
  conversations: Conversation[];
  savedAnswers: SavedAnswerRecord[];
  documents: StudyDocument[];
  passages: SyllabusPassage[];
  revisionCards: RevisionCard[];
  topicActivities: TopicActivityRecord[];
  practiceQuestions: PracticeQuestion[];
  settings: AppSettings;
}> {
  let documents = await getAllFromStore<StudyDocument>('documents');
  let passages = await getAllFromStore<SyllabusPassage>('passages');
  let revisionCards = await getAllFromStore<RevisionCard>('revision_cards');
  let practiceQuestions = await getAllFromStore<PracticeQuestion>('practice_questions');
  const conversations = await getAllFromStore<Conversation>('conversations');
  const savedAnswers = await getAllFromStore<SavedAnswerRecord>('saved_answers');
  const topicActivities = await getAllFromStore<TopicActivityRecord>('topic_activity');
  const settingsArr = await getAllFromStore<{ id: string; value: AppSettings }>('settings');

  // Seed initial built-in documents & passages if empty
  if (documents.length === 0) {
    for (const doc of INITIAL_STUDY_DOCUMENTS) {
      await putInStore('documents', doc);
    }
    documents = [...INITIAL_STUDY_DOCUMENTS];
  }

  if (passages.length === 0) {
    for (const p of INITIAL_SYLLABUS_PASSAGES) {
      await putInStore('passages', p);
    }
    passages = [...INITIAL_SYLLABUS_PASSAGES];
  }

  if (practiceQuestions.length === 0) {
    for (const pq of INITIAL_PRACTICE_QUESTIONS) {
      await putInStore('practice_questions', pq);
    }
    practiceQuestions = [...INITIAL_PRACTICE_QUESTIONS];
  }

  if (revisionCards.length === 0) {
    for (const rc of INITIAL_REVISION_CARDS) {
      await putInStore('revision_cards', rc);
    }
    revisionCards = [...INITIAL_REVISION_CARDS];
  }

  const settingsRecord = settingsArr.find((s) => s.id === 'app_settings');
  const rawSettings = settingsRecord ? settingsRecord.value : DEFAULT_APP_SETTINGS;
  const normalizedProvider =
    rawSettings.runtimeConfig?.providerType === 'local_http_ollama' &&
    rawSettings.runtimeConfig?.modelId !== 'gemma4:4b'
      ? 'local_http_ollama'
      : 'transformers_js_browser';
  const normalizedModelId =
    !rawSettings.runtimeConfig?.modelId ||
    rawSettings.runtimeConfig.modelId === 'gemma4:4b'
      ? 'onnx-community/gemma-3-270m-it-ONNX'
      : rawSettings.runtimeConfig.modelId;

  const settings: AppSettings = {
    ...DEFAULT_APP_SETTINGS,
    ...rawSettings,
    runtimeConfig: {
      ...DEFAULT_APP_SETTINGS.runtimeConfig,
      ...rawSettings.runtimeConfig,
      providerType: normalizedProvider,
      modelId: normalizedModelId,
    },
  };

  // Sort conversations newest first
  conversations.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  savedAnswers.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  return {
    conversations,
    savedAnswers,
    documents,
    passages,
    revisionCards,
    topicActivities,
    practiceQuestions,
    settings,
  };
}

export async function saveConversation(conv: Conversation): Promise<void> {
  await putInStore('conversations', conv);
}

export async function deleteConversationById(id: string): Promise<void> {
  await deleteFromStore('conversations', id);
}

export async function clearAllConversations(): Promise<void> {
  await clearStore('conversations');
}

export async function saveAnswerRecord(record: SavedAnswerRecord): Promise<void> {
  await putInStore('saved_answers', record);
}

export async function deleteSavedAnswerById(id: string): Promise<void> {
  await deleteFromStore('saved_answers', id);
}

export async function saveStudyDocumentAndPassages(
  doc: StudyDocument,
  newPassages: SyllabusPassage[]
): Promise<void> {
  await putInStore('documents', doc);
  for (const p of newPassages) {
    await putInStore('passages', p);
  }
}

export async function deleteStudyDocumentAndPassages(
  docId: string,
  allPassages: SyllabusPassage[]
): Promise<void> {
  await deleteFromStore('documents', docId);
  const toRemove = allPassages.filter((p) => p.documentId === docId);
  for (const p of toRemove) {
    await deleteFromStore('passages', p.id);
  }
}

export async function clearUserImportedDocuments(
  allDocs: StudyDocument[],
  allPassages: SyllabusPassage[]
): Promise<void> {
  const userDocs = allDocs.filter((d) => !d.isBuiltIn);
  for (const d of userDocs) {
    await deleteStudyDocumentAndPassages(d.id, allPassages);
  }
}

export async function saveRevisionCard(card: RevisionCard): Promise<void> {
  await putInStore('revision_cards', card);
}

export async function deleteRevisionCard(id: string): Promise<void> {
  await deleteFromStore('revision_cards', id);
}

export async function saveTopicActivity(record: TopicActivityRecord): Promise<void> {
  await putInStore('topic_activity', record);
}

export async function savePracticeQuestion(question: PracticeQuestion): Promise<void> {
  await putInStore('practice_questions', question);
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await putInStore('settings', { id: 'app_settings', value: settings });
}

export function computeStorageBreakdown(data: {
  conversations: Conversation[];
  savedAnswers: SavedAnswerRecord[];
  documents: StudyDocument[];
  passages: SyllabusPassage[];
  revisionCards: RevisionCard[];
  topicActivities: TopicActivityRecord[];
  practiceQuestions: PracticeQuestion[];
}): StorageBreakdown {
  const messagesCount = data.conversations.reduce(
    (acc, c) => acc + c.messages.length,
    0
  );
  const jsonPayload = JSON.stringify(data);
  const approximateBytes = new TextEncoder().encode(jsonPayload).length;

  return {
    conversationsCount: data.conversations.length,
    messagesCount,
    savedAnswersCount: data.savedAnswers.length,
    documentsCount: data.documents.length,
    passagesCount: data.passages.length,
    revisionCardsCount: data.revisionCards.length,
    activityRecordsCount: data.topicActivities.length,
    practiceQuestionsCount: data.practiceQuestions.length,
    approximateBytes,
  };
}
