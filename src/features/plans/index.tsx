import { Route, Routes } from 'react-router';
import { PlanBuilderPage } from './PlanBuilder';
import { PlanDetailPage } from './PlanDetail';
import { PlanListPage } from './PlanList';

export function PlansRoutes() {
  return (
    <Routes>
      <Route index element={<PlanListPage />} />
      <Route path="new" element={<PlanBuilderPage />} />
      <Route path=":id/edit" element={<PlanBuilderPage />} />
      <Route path=":id" element={<PlanDetailPage />} />
    </Routes>
  );
}
