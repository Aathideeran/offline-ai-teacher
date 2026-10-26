import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ChapterInfo,
  LanguageCode,
  StudyDocument,
  SubjectId,
  SyllabusPassage,
} from '../types';
import { TRANSLATIONS } from '../modules/i18n/translations';
import { searchLocalSyllabusPassages } from '../modules/syllabus/retrievalEngine';

interface SyllabusLibraryViewProps {
  language: LanguageCode;
  documents: StudyDocument[];
  passages: SyllabusPassage[];
  chapters: ChapterInfo[];
  onImportDocument: (params: {
    title: string;
    subjectId: SubjectId;
    className: string;
    chapterId: string;
    source: string;
    isOfficialSyllabus: boolean;
    fileName?: string;
    rawText: string;
  }) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
}

export const SyllabusLibraryView: React.FC<SyllabusLibraryViewProps> = ({
  language,
  documents,
  passages,
  chapters,
  onImportDocument,
  onDeleteDocument,
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'documents' | 'search'>('documents');
  const [showImportForm, setShowImportForm] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<SubjectId | 'all'>('all');

  // Import form state
  const [docTitle, setDocTitle] = useState<string>('');
  const [subjectId, setSubjectId] = useState<SubjectId>('math_10');
  const [className, setClassName] = useState<string>('Class 10');
  const [chapterId, setChapterId] = useState<string>('math_10_ch3');
  const [source, setSource] = useState<string>('School Study Notes');
  const [isOfficialSyllabus, setIsOfficialSyllabus] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (!docTitle.trim()) {
      setDocTitle(file.name.replace(/\.[^.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setRawText(text);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    await onImportDocument({
      title: docTitle.trim(),
      subjectId,
      className: className.trim() || 'Class 10',
      chapterId,
      source: source.trim() || 'Local Import',
      isOfficialSyllabus,
      fileName: fileName || undefined,
      rawText,
    });

    setImportFeedback(`Processed document "${docTitle.trim()}". Check status in the table below.`);
    setDocTitle('');
    setFileName('');
    setRawText('');
    setShowImportForm(false);
  };

  const searchResults = searchQuery.trim()
    ? searchLocalSyllabusPassages(passages, searchQuery, {
        subjectId: filterSubject === 'all' ? undefined : filterSubject,
        topK: 10,
      })
    : passages
        .filter((p) => filterSubject === 'all' || p.subjectId === filterSubject)
        .map((passage) => ({
          passage,
          relevanceScore: 1,
          matchedTerms: [],
        }));

  return (
    <div className="space-y-6">
      {/* Header & Board Alignment Disclaimer */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.library.title}</h1>
            <p className="text-xs text-slate-600 mt-1">{t.library.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowImportForm((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.library.importButton}</span>
          </button>
        </div>

        <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
          {t.library.officialDisclaimer}
        </div>

        {importFeedback && (
          <div className="mt-3 p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
            <span>{importFeedback}</span>
            <button
              type="button"
              onClick={() => setImportFeedback(null)}
              className="text-sky-700 font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </section>

      {/* Expandable Import Form */}
      {showImportForm && (
        <section
          aria-label={t.library.importModalTitle}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
        >
          <h2 className="text-base font-bold text-slate-900 mb-4">
            {t.library.importModalTitle}
          </h2>
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="import-doc-title"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.library.docTitleLabel}
                </label>
                <input
                  id="import-doc-title"
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g., Chapter 6 Triangles Notes"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="import-doc-subject"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.library.subjectLabel}
                </label>
                <select
                  id="import-doc-subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value as SubjectId)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="math_10">{t.subjects.math_10}</option>
                  <option value="science_10">{t.subjects.science_10}</option>
                  <option value="other">{t.subjects.other}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="import-doc-class"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.library.classLabel}
                </label>
                <input
                  id="import-doc-class"
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="import-doc-chapter"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.library.chapterLabel}
                </label>
                <select
                  id="import-doc-chapter"
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {chapters
                    .filter((c) => c.subjectId === subjectId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Ch {c.number}: {c.titleEn}
                      </option>
                    ))}
                  <option value="custom_chapter">General / Custom Chapter</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="import-doc-source"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.library.sourceLabel}
                </label>
                <input
                  id="import-doc-source"
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g., State Board Class 10 Textbook Ch 3"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="import-doc-file"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.library.fileUploadLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="import-doc-file"
                    type="file"
                    accept=".txt,.md,.json,.pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="import-doc-content"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                {t.library.pasteContentLabel}
              </label>
              <textarea
                id="import-doc-content"
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="# Section Heading&#10;Paste textbook definitions, theorems, or study notes here. Separate sections with a blank line..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="official-syllabus-checkbox"
                type="checkbox"
                checked={isOfficialSyllabus}
                onChange={(e) => setIsOfficialSyllabus(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-sky-600"
              />
              <label
                htmlFor="official-syllabus-checkbox"
                className="text-xs text-slate-700"
              >
                Mark as verified official board syllabus material (only check if importing directly from an official textbook)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowImportForm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {t.library.cancel}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t.library.submitImport}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tab Switcher: Stored Documents vs Local Passage Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'documents'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.library.documentsTab} ({documents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'search'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.library.passageSearchTab} ({passages.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label={t.library.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'search') setActiveTab('search');
                }}
                placeholder={t.library.searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>
            <select
              aria-label="Filter passages by subject"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value as SubjectId | 'all')}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">All Subjects</option>
              <option value="math_10">{t.subjects.math_10}</option>
              <option value="science_10">{t.subjects.science_10}</option>
            </select>
          </div>
        </div>

        {activeTab === 'documents' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 pr-4">{t.library.colTitle}</th>
                  <th className="py-2.5 px-3">{t.library.colSubject}</th>
                  <th className="py-2.5 px-3">{t.library.colClass}</th>
                  <th className="py-2.5 px-3">{t.library.colSource}</th>
                  <th className="py-2.5 px-3 text-right">{t.library.colPassages}</th>
                  <th className="py-2.5 px-3">{t.library.colStatus}</th>
                  <th className="py-2.5 pl-3 text-right">{t.library.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p>{doc.title}</p>
                          {doc.statusNote && (
                            <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                              {doc.statusNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {t.subjects[doc.subjectId]}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{doc.className}</td>
                    <td className="py-3 px-3">
                      <span>{doc.source}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="text-slate-500">
                        {doc.isOfficialSyllabus
                          ? 'Official Syllabus'
                          : 'Reference Material'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {doc.passageCount}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {doc.importStatus === 'ready' ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Scanned / Unsupported
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      {!doc.isBuiltIn ? (
                        <button
                          type="button"
                          onClick={() => onDeleteDocument(doc.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.library.deleteDoc}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">Built-in</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            {searchResults.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No local syllabus passages matched "{searchQuery}". Try another keyword or import additional study notes.
              </p>
            ) : (
              searchResults.map(({ passage, relevanceScore, matchedTerms }) => (
                <article
                  key={passage.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                      {passage.chapterTitle} — {passage.sectionHeading}
                    </span>
                    <span className="tabular-nums">
                      {passage.sourceLabel}
                      {searchQuery.trim() && ` · Score: ${relevanceScore}`}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {passage.content}
                  </p>
                  {passage.formulas.length > 0 && (
                    <p className="text-xs font-mono text-sky-900 pt-1">
                      Formulas: {passage.formulas.join('  |  ')}
                    </p>
                  )}
                  {matchedTerms.length > 0 && (
                    <p className="text-[11px] text-slate-500">
                      Matched keywords: {matchedTerms.join(', ')}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
