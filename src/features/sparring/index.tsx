import { useState } from 'react';
import { Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/Page';
import { MatchHistory } from './MatchHistory';
import { MatchScreen } from './MatchScreen';
import { ResultForm } from './ResultForm';
import { SetupForm, type MatchConfig } from './SetupForm';
import type { ScoreEvent } from './scoring';

type View =
  | { step: 'setup' }
  | { step: 'match'; config: MatchConfig }
  | { step: 'result'; config: MatchConfig; events: ScoreEvent[]; durationSec: number };

function SparringHome() {
  const { t } = useTranslation('sparring');
  const [view, setView] = useState<View>({ step: 'setup' });
  const toSetup = () => setView({ step: 'setup' });

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      {view.step === 'setup' && (
        <>
          <SetupForm onStart={(config) => setView({ step: 'match', config })} />
          <MatchHistory />
        </>
      )}
      {view.step === 'match' && (
        <MatchScreen
          config={view.config}
          onFinish={(events, durationSec) => setView({ step: 'result', config: view.config, events, durationSec })}
        />
      )}
      {view.step === 'result' && (
        <ResultForm config={view.config} events={view.events} durationSec={view.durationSec} onDone={toSetup} />
      )}
    </>
  );
}

export function SparringRoutes() {
  return (
    <Routes>
      <Route index element={<SparringHome />} />
    </Routes>
  );
}
