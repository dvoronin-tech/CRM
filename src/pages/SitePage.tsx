import { Anchor, Button, Group, Modal, Select, Stack, Table, Textarea, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { type FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ErrorText, PageLoader } from '../components/PageStatus';
import { TASK_STATUS_LABEL } from '../domain/labels';
import { useQuery } from '../hooks/useQuery';
import { fetchSiteDetail } from '../lib/queries';
import layout from '../styles/layout.module.scss';

export function SitePage() {
  const { id = '' } = useParams();
  const { profile } = useAuth();
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [notice, setNotice] = useState<string | null>(null);
  const viewer = profile ? { id: profile.id, role: profile.role } : null;
  const { data, error, loading } = useQuery(() => fetchSiteDetail(id, viewer), [id, profile?.id, profile?.role]);

  function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: insert into public.tasks for this site. Status starts as "new". Author is the current assigner.
    setNotice('Создание задачи пока не подключено');
  }

  function handleDelete() {
    // TODO: delete the site. Confirm because tasks cascade with it. Assigner only.
    setNotice('Удаление пока не подключено');
    closeDelete();
  }

  if (loading && data === null) return <PageLoader />;
  if (error && data === null) return <ErrorText>{error}</ErrorText>;
  if (!data?.site) return <p className={layout.muted}>Объект не найден</p>;

  const { site, tasks } = data;

  return (
    <section className={layout.page}>
      <header className={layout.toolbar}>
        <div>
          <h1 className={layout.title}>{site.name}</h1>
          <p className={layout.muted}>{site.address}</p>
        </div>
        <div className={layout.actions}>
          <Button type="button" onClick={openCreate}>
            Новая задача
          </Button>
          <Button type="button" className={layout.danger} onClick={openDelete}>
            Удалить
          </Button>
        </div>
      </header>
      <p>
        <Anchor component={Link} to="/sites">
          К объектам
        </Anchor>
      </p>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {notice ? <ErrorText>{notice}</ErrorText> : null}
      <h2 className={layout.title}>Задачи</h2>
      {tasks.length === 0 ? <p className={layout.muted}>На этом объекте задач пока нет</p> : null}
      {tasks.length > 0 ? (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th>Исполнитель</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tasks.map((task) => (
              <Table.Tr key={task.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/tasks/${task.id}`}>
                    {task.title}
                  </Anchor>
                </Table.Td>
                <Table.Td>{TASK_STATUS_LABEL[task.status]}</Table.Td>
                <Table.Td>{task.assigneeName ?? 'Имя недоступно'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : null}
      <Modal opened={createOpened} onClose={closeCreate} title="Новая задача">
        <form onSubmit={handleCreateTask}>
          <Stack gap="md">
            <TextInput label="Название" name="title" required />
            <Textarea label="Описание" name="description" autosize minRows={3} />
            <Select label="Исполнитель" name="assignee" placeholder="Список подключится позже" data={[]} />
            {notice ? <ErrorText>{notice}</ErrorText> : null}
            <Group justify="flex-end" gap="sm">
              <Button type="button" variant="default" onClick={closeCreate}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
      <Modal opened={deleteOpened} onClose={closeDelete} title="Удалить объект?">
        <Stack gap="md">
          <p className={layout.muted}>Вместе с объектом удалятся его задачи. Это действие нельзя отменить.</p>
          <Group justify="flex-end" gap="sm">
            <Button type="button" variant="default" onClick={closeDelete}>
              Отмена
            </Button>
            <Button type="button" className={layout.danger} onClick={handleDelete}>
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </section>
  );
}
