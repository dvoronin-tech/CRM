import type { CSSVariablesResolver } from '@mantine/core';

/**
 * Copies :root tokens from styles/tokens.scss into Mantine variables.
 * Color literals stay in that file. The blue aliases exist because
 * primaryColor is "blue" and explicit variants inline those names.
 */
const schemeColors = {
  '--mantine-color-text': 'var(--color-text)',
  '--mantine-color-body': 'var(--color-bg)',
  '--mantine-color-error': 'var(--color-danger)',
  '--mantine-color-placeholder': 'var(--color-text-muted)',
  '--mantine-color-anchor': 'var(--color-accent)',
  '--mantine-color-default': 'var(--color-surface)',
  '--mantine-color-default-hover': 'var(--color-surface-hover)',
  '--mantine-color-default-color': 'var(--color-text)',
  '--mantine-color-default-border': 'var(--color-border)',
  '--mantine-color-dimmed': 'var(--color-text-muted)',
  '--mantine-primary-color-contrast': 'var(--color-on-accent)',
  '--mantine-color-blue-filled': 'var(--color-accent)',
  '--mantine-color-blue-filled-hover': 'var(--color-accent-hover)',
  '--mantine-color-blue-light': 'var(--color-accent-soft)',
  '--mantine-color-blue-light-hover': 'var(--color-accent-soft)',
  '--mantine-color-blue-light-color': 'var(--color-accent)',
  '--mantine-color-blue-outline': 'var(--color-accent)',
  '--mantine-color-white': 'var(--color-on-accent)',
};

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    '--mantine-font-family': 'var(--font-sans)',
    '--mantine-font-family-headings': 'var(--font-sans)',
    '--mantine-line-height': 'var(--line-height)',
    '--mantine-font-size-sm': 'var(--font-size-sm)',
    '--mantine-font-size-md': 'var(--font-size-md)',
    '--mantine-font-size-lg': 'var(--font-size-lg)',
    '--mantine-font-size-xl': 'var(--font-size-xl)',
    '--mantine-radius-xs': 'var(--radius-1)',
    '--mantine-radius-sm': 'var(--radius-1)',
    '--mantine-radius-md': 'var(--radius-2)',
    '--mantine-radius-lg': 'var(--radius-3)',
    '--mantine-radius-xl': 'var(--radius-3)',
    '--mantine-radius-default': 'var(--radius-2)',
    '--mantine-spacing-xs': 'var(--space-2)',
    '--mantine-spacing-sm': 'var(--space-3)',
    '--mantine-spacing-md': 'var(--space-4)',
    '--mantine-spacing-lg': 'var(--space-5)',
    '--mantine-spacing-xl': 'var(--space-6)',
    '--mantine-primary-color-filled': 'var(--color-accent)',
    '--mantine-primary-color-filled-hover': 'var(--color-accent-hover)',
    '--mantine-primary-color-light': 'var(--color-accent-soft)',
    '--mantine-primary-color-light-hover': 'var(--color-accent-soft)',
    '--mantine-primary-color-light-color': 'var(--color-accent)',
  },
  light: schemeColors,
  dark: schemeColors,
});
