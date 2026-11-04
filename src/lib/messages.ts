type ErrorLike = {
  message: string;
  code?: string;
};

export const CONFIG_ERROR = 'Не заданы параметры подключения к Supabase';

/** Longer codes first so `status_change_forbidden` is not read as `forbidden`. */
const SQL_ERROR_TEXT: readonly (readonly [string, string])[] = [
  ['status_change_forbidden', 'Статус меняется только кнопкой действия'],
  ['profile_role_immutable', 'Роль меняется только вручную в базе'],
  ['assignee_must_be_executor', 'Назначить можно только исполнителя'],
  ['author_must_be_assigner', 'Автором задачи может быть только постановщик'],
  ['task_must_start_new', 'Задача создаётся в статусе «Новая»'],
  ['illegal_transition', 'Такой переход статуса недоступен'],
  ['comment_too_long', 'Комментарий длиннее 2000 символов'],
  ['comment_required', 'Чтобы вернуть задачу, нужен комментарий'],
  ['event_immutable', 'Запись истории нельзя изменить'],
  ['immutable_column', 'Это поле нельзя изменить'],
  ['not_authenticated', 'Сессия истекла, войдите снова'],
  ['task_not_found', 'Задача не найдена'],
  ['forbidden', 'Это действие недоступно вашей роли'],
];

/** Maps a Postgres exception code from the security functions to a screen phrase. */
export function sqlErrorText(error: ErrorLike): string | null {
  const text = `${error.code ?? ''} ${error.message}`;
  if (error.code === 'P0002') return 'Задача не найдена';
  if (error.code === 'P0001') return 'Такой переход статуса недоступен';
  if (error.code === 'PGRST301' || text.toLowerCase().includes('jwt')) {
    return 'Сессия истекла, войдите снова';
  }
  for (const [code, message] of SQL_ERROR_TEXT) {
    if (text.includes(code)) return message;
  }
  return null;
}

export function loadErrorMessage(error: ErrorLike): string {
  const known = sqlErrorText(error);
  if (known) return known;
  if (error.code === '42501') return 'Это действие недоступно вашей роли';
  return 'Не удалось загрузить данные';
}

export function loginErrorMessage(error: ErrorLike): string {
  if (error.code === 'invalid_credentials' || error.message === 'Invalid login credentials') {
    return 'Неверный email или пароль';
  }
  if (error.code === 'email_not_confirmed') return 'Почта ещё не подтверждена';
  if (error.code === 'over_request_rate_limit') {
    return 'Слишком много попыток. Подождите и повторите';
  }
  return 'Не удалось войти. Проверьте почту и пароль';
}

export function mutationErrorMessage(error: ErrorLike, fallback = 'Не удалось сохранить'): string {
  const known = sqlErrorText(error);
  if (known) return known;
  const text = `${error.code ?? ''} ${error.message}`;
  if (text.includes('sites_name_chk') || text.includes('tasks_title_chk')) {
    return 'Название — от 1 до 200 символов';
  }
  if (text.includes('sites_address_chk')) return 'Адрес — от 1 до 500 символов';
  if (text.includes('tasks_description_chk')) return 'Описание длиннее 4000 символов';
  if (text.includes('tasks_assignee_is_not_author_chk')) return 'Нельзя назначить задачу самому себе';
  if (error.code === '42501' || text.includes('row-level security')) {
    return 'Это действие недоступно вашей роли';
  }
  if (error.code === '23503') return 'Связанная запись не найдена';
  return fallback;
}

export function transitionErrorMessage(error: ErrorLike): string {
  return sqlErrorText(error) ?? 'Не удалось сменить статус';
}
