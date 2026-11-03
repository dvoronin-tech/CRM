import { Badge, Button, Group, Modal, Stack, Table, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { TASK_STATUS_LABEL } from '../domain/labels';
import layout from '../styles/layout.module.scss';

export function TaskPage() {
  const { id } = useParams();
  const [reworkOpened, { open: openRework, close: closeRework }] = useDisclosure(false);

  function handleRework(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: call the status transition with a non-empty comment. Direct status updates stay closed.
    closeRework();
  }

  function handleTransition() {
    // TODO: call the status function for the clicked transition. Hide buttons the role cannot use.
  }

  return (
    <section className={layout.page}>
      <header className={layout.toolbar}>
        <div>
          <h1 className={layout.title}>Задача</h1>
          <p className={layout.muted}>Идентификатор: {id ?? '—'}</p>
        </div>
        <Badge variant="light" tt="none">
          {TASK_STATUS_LABEL.new}
        </Badge>
      </header>
      <dl className={layout.meta}>
        <dt>Название</dt>
        {/* TODO: task row from supabase, including site, assignee, author, created_at */}
        <dd>—</dd>
        <dt>Описание</dt>
        <dd>—</dd>
        <dt>Объект</dt>
        <dd>—</dd>
        <dt>Исполнитель</dt>
        <dd>—</dd>
        <dt>Автор</dt>
        <dd>—</dd>
        <dt>Создана</dt>
        <dd>—</dd>
      </dl>
      <div className={layout.actions}>
        <Button type="button" variant="filled" onClick={handleTransition}>
          Взять в работу
        </Button>
        <Button type="button" variant="default" onClick={handleTransition}>
          Отправить на проверку
        </Button>
        <Button type="button" variant="default" onClick={handleTransition}>
          Принять
        </Button>
        <Button type="button" variant="default" onClick={openRework}>
          Вернуть на доработку
        </Button>
      </div>
      <p className={layout.muted}>
        Кнопки — заглушка. После входа останутся только переходы, доступные роли и текущему статусу.
      </p>
      <h2 className={layout.title}>История</h2>
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
          {/* TODO: task_status_events for this task, oldest first. Read-only. */}
          <Table.Tr>
            <Table.Td colSpan={5}>История появится после подключения данных.</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
      <Modal opened={reworkOpened} onClose={closeRework} title="Вернуть на доработку">
        <form onSubmit={handleRework}>
          <Stack gap="md">
            <Textarea label="Комментарий" name="comment" required autosize minRows={3} />
            <Group justify="flex-end" gap="sm">
              <Button type="button" variant="default" onClick={closeRework}>
                Отмена
              </Button>
              <Button type="submit">Вернуть</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </section>
  );
}
