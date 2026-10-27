import { useState } from 'react';
import { Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../../components/Page';
import { getProfile } from '../../db/profile';
import { BeltEditor } from './BeltEditor';
import { GraduationTimeline, type GraduationSuggestion } from './GraduationTimeline';
import { StatsDashboard } from './StatsDashboard';

function ProfilePage() {
  const { t } = useTranslation('profile');
  const profile = useLiveQuery(getProfile, []);
  const [suggestion, setSuggestion] = useState<(GraduationSuggestion & { key: number }) | undefined>();

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <div className="space-y-5">
        {profile && (
          <BeltEditor
            profile={profile}
            onGraduationChange={(belt, stripes) => setSuggestion({ belt, stripes, key: (suggestion?.key ?? 0) + 1 })}
          />
        )}
        {profile && (
          <GraduationTimeline suggestion={suggestion} fallback={{ belt: profile.belt, stripes: profile.stripes }} />
        )}
        <StatsDashboard />
      </div>
    </>
  );
}

export function ProfileRoutes() {
  return (
    <Routes>
      <Route index element={<ProfilePage />} />
    </Routes>
  );
}
