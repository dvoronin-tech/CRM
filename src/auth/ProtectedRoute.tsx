import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '../components/PageStatus';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
