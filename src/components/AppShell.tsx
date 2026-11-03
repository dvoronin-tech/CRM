import { Button } from '@mantine/core';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { USER_ROLE_LABEL, type UserRole } from '../domain/labels';
import { useSession } from '../hooks/useSession';
import { ErrorText } from './PageStatus';
import styles from './AppShell.module.scss';

type NavItem = {
  to: string;
  label: string;
};

const NAV_BY_ROLE: Record<UserRole, readonly NavItem[]> = {
  assigner: [{ to: '/sites', label: 'Объекты' }],
  executor: [
    { to: '/my-tasks', label: 'Мои задачи' },
    { to: '/sites', label: 'Объекты' },
  ],
};

const NAV_WHEN_SIGNED_OUT: readonly NavItem[] = [
  { to: '/sites', label: 'Объекты' },
  { to: '/my-tasks', label: 'Мои задачи' },
];

function isActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell() {
  const sessionUser = useSession();
  const { session, profileError, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const links = sessionUser ? NAV_BY_ROLE[sessionUser.role] : NAV_WHEN_SIGNED_OUT;
  const roleLabel = sessionUser
    ? `${sessionUser.fullName} · ${USER_ROLE_LABEL[sessionUser.role]}`
    : 'Профиль не загружен';

  async function handleLogout() {
    setSignOutError(null);
    const error = await signOut();
    if (error) {
      setSignOutError(error);
      return;
    }
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          Объекты и задачи
        </Link>
        <nav className={styles.nav} aria-label="Разделы">
          {links.map((item) => (
            <Button
              key={item.to}
              component={Link}
              to={item.to}
              variant={isActive(pathname, item.to) ? 'filled' : 'subtle'}
            >
              {item.label}
            </Button>
          ))}
        </nav>
        <div className={styles.session}>
          <p className={styles.role}>{roleLabel}</p>
          {session ? (
            <Button type="button" variant="default" onClick={() => void handleLogout()}>
              Выйти
            </Button>
          ) : null}
        </div>
      </header>
      <main className={styles.main}>
        {profileError ? <ErrorText>{profileError}</ErrorText> : null}
        {signOutError ? <ErrorText>{signOutError}</ErrorText> : null}
        <Outlet />
      </main>
    </div>
  );
}
