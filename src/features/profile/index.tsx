import { Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, PageHeader } from '../../components/Page';

function Placeholder() {
  const { t } = useTranslation('profile');
  return (
    <>
      <PageHeader title={t('title')} />
      <EmptyState>{t('common:empty')}</EmptyState>
    </>
  );
}

export function ProfileRoutes() {
  return (
    <Routes>
      <Route index element={<Placeholder />} />
    </Routes>
  );
}
