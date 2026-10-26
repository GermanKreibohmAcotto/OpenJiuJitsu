import { Route, Routes } from 'react-router';
import { SessionDetail } from './SessionDetail';
import { SessionForm } from './SessionForm';
import { SessionList } from './SessionList';

export function JournalRoutes() {
  return (
    <Routes>
      <Route index element={<SessionList />} />
      <Route path="new" element={<SessionForm />} />
      <Route path=":id/edit" element={<SessionForm />} />
      <Route path=":id" element={<SessionDetail />} />
    </Routes>
  );
}
