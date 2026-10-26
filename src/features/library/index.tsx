import { Route, Routes } from 'react-router';
import { LibraryList } from './LibraryList';
import { TechniqueDetail } from './TechniqueDetail';
import { TechniqueEditRoute, TechniqueForm } from './TechniqueForm';

export function LibraryRoutes() {
  return (
    <Routes>
      <Route index element={<LibraryList />} />
      <Route path="new" element={<TechniqueForm />} />
      <Route path=":id" element={<TechniqueDetail />} />
      <Route path=":id/edit" element={<TechniqueEditRoute />} />
    </Routes>
  );
}
