import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { PageLoader } from '../components/PageStatus';

export function HomeRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (profile?.role === 'executor') return <Navigate to="/my-tasks" replace />;
  return <Navigate to="/sites" replace />;
}
