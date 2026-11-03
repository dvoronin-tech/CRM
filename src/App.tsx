import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { SitePage } from './pages/SitePage';
import { SitesPage } from './pages/SitesPage';
import { TaskPage } from './pages/TaskPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/sites/:id" element={<SitePage />} />
        <Route path="/tasks/:id" element={<TaskPage />} />
        <Route path="/my-tasks" element={<MyTasksPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/sites" replace />} />
    </Routes>
  );
}
