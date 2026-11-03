type ErrorLike = {
  message: string;
  code?: string;
};

export const CONFIG_ERROR = 'Не заданы параметры подключения к Supabase';

export function loadErrorMessage(error: ErrorLike): string {
  if (error.code === 'PGRST301' || error.message.toLowerCase().includes('jwt')) {
    return 'Сессия истекла, войдите снова';
  }
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
  const text = `${error.code ?? ''} ${error.message}`;
  if (text.includes('sites_name_chk') || text.includes('tasks_title_chk')) {
    return 'Название — от 1 до 200 символов';
  }
  if (text.includes('sites_address_chk')) return 'Адрес — от 1 до 500 символов';
  if (text.includes('tasks_description_chk')) return 'Описание длиннее 4000 символов';
  if (text.includes('tasks_assignee_is_not_author_chk')) return 'Нельзя назначить задачу самому себе';
  if (text.includes('assignee_must_be_executor')) return 'Назначить можно только исполнителя';
  if (text.includes('author_must_be_assigner')) return 'Автором задачи может быть только постановщик';
  if (error.code === '42501' || text.includes('row-level security')) {
    return 'Это действие недоступно вашей роли';
  }
  if (error.code === '23503') return 'Связанная запись не найдена';
  if (text.includes('not_authenticated') || error.code === 'PGRST301' || text.toLowerCase().includes('jwt')) {
    return 'Сессия истекла, войдите снова';
  }
  return fallback;
}

export function transitionErrorMessage(error: ErrorLike): string {
  const text = `${error.code ?? ''} ${error.message}`;
  if (text.includes('task_not_found') || error.code === 'P0002') return 'Задача не найдена';
  if (text.includes('not_authenticated')) return 'Сессия истекла, войдите снова';
  if (text.includes('forbidden')) return 'Это действие недоступно вашей роли';
  if (text.includes('illegal_transition')) return 'Такой переход статуса недоступен';
  if (text.includes('comment_required')) return 'Чтобы вернуть задачу, нужен комментарий';
  if (text.includes('comment_too_long')) return 'Комментарий длиннее 2000 символов';
  return 'Не удалось сменить статус';
}
