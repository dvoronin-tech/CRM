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
