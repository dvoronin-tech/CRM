import { Button, TextInput } from '@mantine/core';
import { type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import styles from './LoginPage.module.scss';

export function LoginPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: const form = new FormData(event.currentTarget);
    // TODO: getSupabase().auth.signInWithPassword({ email, password })
    // TODO: show the Russian error when the password is wrong, then go to /sites or /my-tasks by role.
  }

  return (
    <main className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Вход</h1>
        <TextInput label="Email" name="email" type="email" autoComplete="username" required />
        <TextInput
          label="Пароль"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Button type="submit">Войти</Button>
        <p className={styles.note}>Регистрация закрыта. Учётную запись выдаёт администратор.</p>
        <Link to="/sites">К списку объектов</Link>
      </form>
    </main>
  );
}
