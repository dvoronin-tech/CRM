import type { UserRole } from '../domain/labels';

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

/**
 * Auth is not wired yet.
 * TODO: subscribe to getSupabase().auth and load role plus full_name from public.profiles.
 */
export function useSession(): SessionUser | null {
  return null;
}
