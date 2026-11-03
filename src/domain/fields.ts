export const FIELD_LIMIT = {
  siteName: 200,
  address: 500,
  taskTitle: 200,
  description: 4000,
  comment: 2000,
} as const;

export function validateSiteFields(name: string, address: string): string | null {
  if (name.length < 1 || name.length > FIELD_LIMIT.siteName) {
    return `Название — от 1 до ${FIELD_LIMIT.siteName} символов`;
  }
  if (address.length < 1 || address.length > FIELD_LIMIT.address) {
    return `Адрес — от 1 до ${FIELD_LIMIT.address} символов`;
  }
  return null;
}

export function validateTaskFields(title: string, description: string, assigneeId: string): string | null {
  if (title.length < 1 || title.length > FIELD_LIMIT.taskTitle) {
    return `Название — от 1 до ${FIELD_LIMIT.taskTitle} символов`;
  }
  if (description.length > FIELD_LIMIT.description) {
    return `Описание длиннее ${FIELD_LIMIT.description} символов`;
  }
  if (!assigneeId) return 'Выберите исполнителя';
  return null;
}
