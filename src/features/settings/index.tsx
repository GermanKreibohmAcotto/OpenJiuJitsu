import { useEffect, useState, type ChangeEvent } from 'react';
import { Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../app/settings';
import { ModeToggle } from '../../components/ModeToggle';
import { PageHeader } from '../../components/Page';
import { BackupError, exportData, importData, parseBackup } from '../../db/backup';
import { todayIso } from '../../db/ids';
import { LANGS } from '../../domain/types';
import { isLang } from '../../i18n';

type Status = { kind: 'success' | 'error'; message: string } | null;

function downloadJson(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function SettingsPage() {
  const { t } = useTranslation('settings');
  const { lang, setLang, modeFilter, setModeFilter } = useSettings();
  const [status, setStatus] = useState<Status>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null));
  }, []);

  const requestPersistence = async () => {
    setPersisted((await navigator.storage?.persist?.()) ?? false);
  };

  const onExport = async () => {
    const backup = await exportData();
    downloadJson(`openjiujitsu-${todayIso()}.json`, JSON.stringify(backup, null, 2));
    setStatus({ kind: 'success', message: t('backup.exported') });
  };

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      // Validate everything before asking, so a bad file never reaches the database.
      const backup = parseBackup(await file.text());
      if (!window.confirm(t('backup.confirmImport'))) return;
      await importData(backup);
      setStatus({ kind: 'success', message: t('backup.imported') });
    } catch (error) {
      const message =
        error instanceof BackupError ? t(`backup.errors.${error.code}`, error.params) : t('backup.errors.unknown');
      setStatus({ kind: 'error', message });
    }
  };

  return (
    <>
      <PageHeader title={t('title')} />
      <div className="flex flex-col gap-4">
        <section className="card flex flex-col gap-4">
          <h2 className="font-semibold">{t('preferences')}</h2>
          <div>
            <label htmlFor="settings-lang" className="label">
              {t('language')}
            </label>
            <select
              id="settings-lang"
              className="input max-w-xs"
              value={lang}
              onChange={(e) => isLang(e.target.value) && setLang(e.target.value)}
            >
              {LANGS.map((code) => (
                <option key={code} value={code}>
                  {t(`languages.${code}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">{t('modeDefault')}</span>
            <ModeToggle value={modeFilter} onChange={setModeFilter} allowAll />
            <p className="mt-1 text-xs text-muted">{t('modeHelp')}</p>
          </div>
        </section>

        <section className="card flex flex-col gap-3">
          <h2 className="font-semibold">{t('backup.title')}</h2>
          <p className="text-sm text-muted">{t('backup.help')}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={onExport}>
              {t('backup.export')}
            </button>
            <label className="btn cursor-pointer">
              {t('backup.import')}
              <input type="file" accept="application/json,.json" className="sr-only" onChange={onImport} />
            </label>
          </div>
          {status && (
            <p
              role={status.kind === 'error' ? 'alert' : 'status'}
              className={`text-sm ${status.kind === 'error' ? 'text-danger' : 'text-accent'}`}
            >
              {status.message}
            </p>
          )}
        </section>

        <section className="card flex flex-col gap-2">
          <h2 className="font-semibold">{t('storage.title')}</h2>
          <p className="text-sm text-muted">{t('storage.help')}</p>
          {persisted === true && <p className="text-sm text-accent">{t('storage.persisted')}</p>}
          {persisted === false && (
            <button type="button" className="btn self-start" onClick={requestPersistence}>
              {t('storage.request')}
            </button>
          )}
        </section>

        <p className="text-center text-xs text-muted">OpenJiuJitsu v{__APP_VERSION__}</p>
      </div>
    </>
  );
}

export function SettingsRoutes() {
  return (
    <Routes>
      <Route index element={<SettingsPage />} />
    </Routes>
  );
}
