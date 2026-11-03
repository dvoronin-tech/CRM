import { Loader } from '@mantine/core';
import type { ReactNode } from 'react';
import layout from '../styles/layout.module.scss';

export function PageLoader() {
  return (
    <div className={layout.page}>
      <Loader color="blue" aria-label="Загрузка" />
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className={layout.error} role="alert">
      {children}
    </p>
  );
}
