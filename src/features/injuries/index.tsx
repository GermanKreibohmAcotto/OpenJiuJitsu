import { Route, Routes } from 'react-router';
import { InjuryForm } from './InjuryForm';
import { InjuryList } from './InjuryList';

export function InjuriesRoutes() {
  return (
    <Routes>
      <Route index element={<InjuryList />} />
      <Route path="new" element={<InjuryForm />} />
      <Route path=":id/edit" element={<InjuryForm />} />
    </Routes>
  );
}
