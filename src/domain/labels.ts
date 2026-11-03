export type UserRole = 'assigner' | 'executor';

export type TaskStatus = 'new' | 'in_progress' | 'in_review' | 'accepted' | 'rework';

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  assigner: 'Постановщик',
  executor: 'Исполнитель',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  in_review: 'На проверке',
  accepted: 'Принята',
  rework: 'На доработке',
};
