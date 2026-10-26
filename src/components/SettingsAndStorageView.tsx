import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  Globe,
  Shield,
  Trash2,
} from 'lucide-react';
import { AppSettings, LanguageCode, StorageBreakdown } from '../types';
import { TRANSLATIONS } from '../modules/i18n/translations';

interface SettingsAndStorageViewProps {
  language: LanguageCode;
  settings: AppSettings;
  storageBreakdown: StorageBreakdown;
  onUpdateSettings: (newSettings: AppSettings) => Promise<void>;
  onClearConversations: () => Promise<void>;
  onClearImportedDocs: () => Promise<void>;
  onExportBackup: () => void;
}

export const SettingsAndStorageView: React.FC<SettingsAndStorageViewProps> = ({
  language,
  settings,
  storageBreakdown,
  onUpdateSettings,
  onClearConversations,
  onClearImportedDocs,
  onExportBackup,
}) => {
  const t = TRANSLATIONS[language];
  const [confirmAction, setConfirmAction] = useState<
    'conversations' | 'docs' | null
  >(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLanguageChange = async (lang: LanguageCode) => {
    await onUpdateSettings({
      ...settings,
      language: lang,
    });
    setStatusMessage(
      lang === 'ta'
        ? 'செயலி மொழி தமிழுக்கு மாற்றப்பட்டு சேமிக்கப்பட்டது.'
        : 'Interface language switched to English and saved.'
    );
  };

  const handleToggleHintFirst = async (checked: boolean) => {
    await onUpdateSettings({
      ...settings,
      preferHintFirst: checked,
    });
  };

  const executeConfirmedDelete = async () => {
    if (confirmAction === 'conversations') {
      await onClearConversations();
      setStatusMessage(
        'All stored conversations have been deleted from local storage.'
      );
    } else if (confirmAction === 'docs') {
      await onClearImportedDocs();
      setStatusMessage(
        'All user-imported study documents have been deleted.'
      );
    }
    setConfirmAction(null);
  };

  const kbUsed = (storageBreakdown.approximateBytes / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {t.settings.title}
          </h1>
          <p className="text-xs text-slate-600 mt-1">{t.settings.subtitle}</p>
        </div>

        {/* Privacy Guarantee */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-700 leading-relaxed">
            {t.settings.privacyStatement}
          </p>
        </div>

        {/* Language & Study Preferences */}
        <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xs font-semibold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-600" />
              <span>{t.settings.languageSection}</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  language === 'en'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                English (en)
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ta')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  language === 'ta'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-slate-900 mb-2.5">
              Pedagogical Default Behavior
            </h2>
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preferHintFirst}
                onChange={(e) => handleToggleHintFirst(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-sky-600"
              />
              <span>
                Always start responses on Hint 1 (Progressive Hint Ladder)
                before revealing the full solution
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Local IndexedDB Storage Management */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-600" />
            <span>{t.settings.storageSection}</span>
          </h2>
          <span className="text-xs font-mono font-semibold text-slate-800 tabular-nums">
            Total Footprint: ~{kbUsed} KB
          </span>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">
              {t.doubt.recentConversations}
            </p>
            <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {storageBreakdown.conversationsCount}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">Chat Messages</p>
            <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {storageBreakdown.messagesCount}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">
              {t.doubt.savedAnswersTab}
            </p>
            <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {storageBreakdown.savedAnswersCount}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">Study Documents</p>
            <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {storageBreakdown.documentsCount}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">Indexed Passages</p>
            <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {storageBreakdown.passagesCount}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">Revision Cards</p>
            <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {storageBreakdown.revisionCardsCount}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500">Topic Logs</p>
            <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {storageBreakdown.activityRecordsCount}
            </p>
          </div>
        </div>

        {/* User-Consented Data Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportBackup}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t.settings.exportBackup}</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmAction('conversations')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.settings.clearConversations}</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmAction('docs')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.settings.clearImportedDocs}</span>
          </button>
        </div>

        {confirmAction && (
          <div
            role="alertdialog"
            aria-label="Confirm Data Deletion"
            className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-xs font-medium text-red-900">
              Are you sure you want to permanently delete{' '}
              {confirmAction === 'conversations'
                ? 'all stored local conversations'
                : 'all user-imported study documents'}
              ? This action requires your explicit confirmation and cannot be
              undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
              >
                {t.library.cancel}
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                {t.settings.confirmDelete}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
