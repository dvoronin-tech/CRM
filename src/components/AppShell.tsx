import { Button } from '@mantine/core';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { USER_ROLE_LABEL, type UserRole } from '../domain/labels';
import { useSession } from '../hooks/useSession';
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
  const session = useSession();
  const { pathname } = useLocation();
  const links = session ? NAV_BY_ROLE[session.role] : NAV_WHEN_SIGNED_OUT;
  const roleLabel = session ? USER_ROLE_LABEL[session.role] : 'Роль не загружена';

  function handleLogout() {
    // TODO: await getSupabase().auth.signOut() and navigate to /login.
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/sites">
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
          {session ? null : (
            <Button component={Link} to="/login" variant="default">
              Войти
            </Button>
          )}
          <Button type="button" variant="default" onClick={handleLogout}>
            Выйти
          </Button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
