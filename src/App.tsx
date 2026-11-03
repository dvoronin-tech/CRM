import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { HomeRedirect } from './pages/HomeRedirect';
import { LoginPage } from './pages/LoginPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { SitePage } from './pages/SitePage';
import { SitesPage } from './pages/SitesPage';
import { TaskPage } from './pages/TaskPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/sites/:id" element={<SitePage />} />
          <Route path="/tasks/:id" element={<TaskPage />} />
          <Route path="/my-tasks" element={<MyTasksPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
