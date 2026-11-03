import { Button, PasswordInput, TextInput } from '@mantine/core';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ErrorText, PageLoader } from '../components/PageStatus';
import styles from './LoginPage.module.scss';

type LoginLocationState = {
  from?: string;
};

export function LoginPage() {
  const { session, profile, loading, configError, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as LoginLocationState | null)?.from;
  const fallback = profile?.role === 'executor' ? '/my-tasks' : '/sites';
  const nextPath = from && from !== '/login' ? from : fallback;

  if (loading) return <PageLoader />;
  if (session) return <Navigate to={nextPath} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Введите почту');
      return;
    }
    if (!password) {
      setError('Введите пароль');
      return;
    }

    setSubmitting(true);
    setError(null);
    const signInError = await signIn(trimmedEmail, password);
    setSubmitting(false);
    setError(signInError);
  }

  return (
    <main className={styles.screen}>
      <form className={styles.card} noValidate onSubmit={(event) => void handleSubmit(event)}>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.note}>Регистрация закрыта. Учётную запись выдаёт администратор.</p>
        {configError ? <ErrorText>{configError}</ErrorText> : null}
        <TextInput
          label="Почта"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
        <PasswordInput
          label="Пароль"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button type="submit" loading={submitting} disabled={Boolean(configError)}>
          Войти
        </Button>
      </form>
    </main>
  );
}
