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

export type TaskAction = {
  to: TaskStatus;
  label: string;
  needsComment: boolean;
};

/** Status buttons for this role. An executor only moves a task assigned to them. */
export function actionsFor(role: UserRole, status: TaskStatus, isAssignee: boolean): TaskAction[] {
  if (role === 'executor' && isAssignee && status === 'new') {
    return [{ to: 'in_progress', label: 'Взять в работу', needsComment: false }];
  }
  if (role === 'executor' && isAssignee && status === 'in_progress') {
    return [{ to: 'in_review', label: 'Отправить на проверку', needsComment: false }];
  }
  if (role === 'executor' && isAssignee && status === 'rework') {
    return [{ to: 'in_progress', label: 'Вернуть в работу', needsComment: false }];
  }
  if (role === 'assigner' && status === 'in_review') {
    return [
      { to: 'accepted', label: 'Принять', needsComment: false },
      { to: 'rework', label: 'Вернуть на доработку', needsComment: true },
    ];
  }
  return [];
}
