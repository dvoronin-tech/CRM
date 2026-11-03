import { Anchor, Badge, Button, Group, Modal, Stack, Table, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { type FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ErrorText, PageLoader } from '../components/PageStatus';
import { actionsFor, TASK_STATUS_LABEL } from '../domain/labels';
import { formatDateTime } from '../lib/format';
import type { TaskStatus } from '../lib/database';
import { fetchTask, transitionTask } from '../lib/queries';
import { useQuery } from '../hooks/useQuery';
import layout from '../styles/layout.module.scss';

export function TaskPage() {
  const { id = '' } = useParams();
  const { profile } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reworkOpened, { open: openRework, close: closeRework }] = useDisclosure(false);
  const { data, error, loading } = useQuery(() => fetchTask(id), [id, reloadKey]);

  async function runTransition(toStatus: TaskStatus, comment: string | null) {
    setPending(true);
    setActionError(null);
    const result = await transitionTask(id, toStatus, comment);
    setPending(false);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    closeRework();
    setReloadKey((value) => value + 1);
  }

  function handleRework(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const comment = String(new FormData(event.currentTarget).get('comment') ?? '').trim();
    if (!comment) {
      setActionError('Чтобы вернуть задачу, нужен комментарий');
      return;
    }
    void runTransition('rework', comment);
  }

  if (loading && data === null) return <PageLoader />;
  if (error && data === null) return <ErrorText>{error}</ErrorText>;
  if (!data?.task) return <p className={layout.muted}>Задача не найдена</p>;

  const { task, history } = data;
  const actions = profile ? actionsFor(profile.role, task.status) : [];
  const directActions = actions.filter((action) => !action.needsComment);
  const reworkAction = actions.find((action) => action.needsComment);

  return (
    <section className={layout.page}>
      <header className={layout.toolbar}>
        <div>
          <h1 className={layout.title}>{task.title}</h1>
          <p className={layout.muted}>
            <Anchor component={Link} to={`/sites/${task.site_id}`}>
              {task.siteName ?? 'К объекту'}
            </Anchor>
          </p>
        </div>
        <Badge variant="light" tt="none">
          {TASK_STATUS_LABEL[task.status]}
        </Badge>
      </header>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <dl className={layout.meta}>
        <dt>Описание</dt>
        <dd>{task.description || 'Без описания'}</dd>
        <dt>Объект</dt>
        <dd>{task.siteName ?? 'Объект недоступен'}</dd>
        <dt>Адрес</dt>
        <dd>{task.siteAddress ?? '—'}</dd>
        <dt>Исполнитель</dt>
        <dd>{task.assigneeName ?? 'Имя недоступно'}</dd>
        <dt>Автор</dt>
        <dd>{task.authorName ?? 'Имя недоступно'}</dd>
        <dt>Создана</dt>
        <dd>{formatDateTime(task.created_at)}</dd>
      </dl>
      <div className={layout.actions}>
        {directActions.map((action) => (
          <Button
            key={action.to}
            type="button"
            variant="filled"
            loading={pending}
            onClick={() => void runTransition(action.to, null)}
          >
            {action.label}
          </Button>
        ))}
        {reworkAction ? (
          <Button type="button" variant="default" loading={pending} onClick={openRework}>
            {reworkAction.label}
          </Button>
        ) : null}
      </div>
      {actions.length === 0 ? <p className={layout.muted}>Сейчас для вас нет перехода статуса</p> : null}
      {actionError ? <ErrorText>{actionError}</ErrorText> : null}
      <h2 className={layout.title}>История</h2>
      {history.length === 0 ? <p className={layout.muted}>История пока пуста</p> : null}
      {history.length > 0 ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Когда</Table.Th>
              <Table.Th>Кто</Table.Th>
              <Table.Th>Из</Table.Th>
              <Table.Th>В</Table.Th>
              <Table.Th>Комментарий</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {history.map((event) => (
              <Table.Tr key={event.id}>
                <Table.Td>{formatDateTime(event.created_at)}</Table.Td>
                <Table.Td>{event.actorName ?? 'Неизвестный'}</Table.Td>
                <Table.Td>{event.from_status ? TASK_STATUS_LABEL[event.from_status] : '—'}</Table.Td>
                <Table.Td>{TASK_STATUS_LABEL[event.to_status]}</Table.Td>
                <Table.Td>{event.comment ?? '—'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : null}
      <Modal opened={reworkOpened} onClose={closeRework} title="Вернуть на доработку">
        <form onSubmit={handleRework}>
          <Stack gap="md">
            <Textarea label="Комментарий" name="comment" autosize minRows={3} />
            {actionError ? <ErrorText>{actionError}</ErrorText> : null}
            <Group justify="flex-end" gap="sm">
              <Button type="button" variant="default" onClick={closeRework}>
                Отмена
              </Button>
              <Button type="submit" loading={pending}>
                Вернуть
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </section>
  );
}
