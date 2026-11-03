import { useAuth } from '../auth/AuthContext';
import type { UserRole } from '../domain/labels';

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

/** Profile loaded after the auth session listener. Null until that row exists. */
export function useSession(): SessionUser | null {
  const { profile } = useAuth();
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  };
}
