import { Button, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { useMemo, useState, type FormEvent } from 'react';
import { FIELD_LIMIT, validateTaskFields } from '../domain/fields';
import { ErrorText } from './PageStatus';

export type TaskFormValue = {
  title: string;
  description: string;
  assigneeId: string;
};

type ExecutorOption = {
  value: string;
  label: string;
};

type TaskFormModalProps = {
  opened: boolean;
  mode: 'create' | 'edit';
  formKey: string;
  initial: TaskFormValue & { assigneeName: string | null };
  executors: ExecutorOption[];
  executorsLoading: boolean;
  executorsError: string | null;
  onClose: () => void;
  onSubmit: (value: TaskFormValue) => Promise<string | null>;
};

export function TaskFormModal({
  opened,
  mode,
  formKey,
  initial,
  executors,
  executorsLoading,
  executorsError,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={mode === 'create' ? 'Новая задача' : 'Изменить задачу'}>
      {opened ? (
        <TaskForm
          key={formKey}
          initial={initial}
          executors={executors}
          executorsLoading={executorsLoading}
          executorsError={executorsError}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  );
}

function TaskForm({
  initial,
  executors,
  executorsLoading,
  executorsError,
  onClose,
  onSubmit,
}: Omit<TaskFormModalProps, 'opened' | 'mode' | 'formKey'>) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const options = useMemo(() => {
    if (!initial.assigneeId || executors.some((item) => item.value === initial.assigneeId)) {
      return executors;
    }
    return [
      ...executors,
      { value: initial.assigneeId, label: initial.assigneeName ?? 'Текущий исполнитель' },
    ];
  }, [executors, initial.assigneeId, initial.assigneeName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    const nextDescription = description.trim();
    const validation = validateTaskFields(nextTitle, nextDescription, assigneeId);
    if (validation) {
      setError(validation);
      return;
    }

    setPending(true);
    const submitError = await onSubmit({
      title: nextTitle,
      description: nextDescription,
      assigneeId,
    });
    setPending(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    onClose();
  }

  const noExecutors = !executorsLoading && options.length === 0;

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <Stack gap="md">
        <TextInput
          label="Название"
          name="title"
          required
          maxLength={FIELD_LIMIT.taskTitle}
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
        <Textarea
          label="Описание"
          name="description"
          autosize
          minRows={3}
          maxLength={FIELD_LIMIT.description}
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
        />
        <Select
          label="Исполнитель"
          name="assignee"
          required
          placeholder={executorsLoading ? 'Загрузка списка' : 'Выберите исполнителя'}
          data={options}
          value={assigneeId || null}
          disabled={executorsLoading || noExecutors}
          onChange={(value) => setAssigneeId(value ?? '')}
        />
        {executorsError ? <ErrorText>{executorsError}</ErrorText> : null}
        {noExecutors && !executorsError ? (
          <ErrorText>Нет исполнителей, которых можно назначить</ErrorText>
        ) : null}
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Group justify="flex-end" gap="sm">
          <Button type="button" variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={pending} disabled={executorsLoading || noExecutors}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
