import { Button, Group, Modal, Select, Stack, Table, Textarea, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import layout from '../styles/layout.module.scss';

export function SitePage() {
  const { id } = useParams();
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: insert into public.tasks for this site. Status starts as "new". Author is the current assigner.
    closeCreate();
  }

  function handleDelete() {
    // TODO: delete the site. Confirm because tasks cascade with it. Assigner only.
    closeDelete();
  }

  return (
    <section className={layout.page}>
      <header className={layout.toolbar}>
        <div>
          <h1 className={layout.title}>Объект</h1>
          <p className={layout.muted}>Идентификатор: {id ?? '—'}</p>
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
      <dl className={layout.meta}>
        <dt>Название</dt>
        {/* TODO: site.name from supabase.from('sites').select().eq('id', id) */}
        <dd>—</dd>
        <dt>Адрес</dt>
        <dd>—</dd>
      </dl>
      <h2 className={layout.title}>Задачи</h2>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th>Статус</Table.Th>
            <Table.Th>Исполнитель</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {/* TODO: tasks for this site. Executor sees only rows where assignee_id is themselves. Link to /tasks/:id */}
          <Table.Tr>
            <Table.Td colSpan={3}>Задачи появятся после подключения данных.</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
      <Modal opened={createOpened} onClose={closeCreate} title="Новая задача">
        <form onSubmit={handleCreateTask}>
          <Stack gap="md">
            <TextInput label="Название" name="title" required />
            <Textarea label="Описание" name="description" autosize minRows={3} />
            <Select
              label="Исполнитель"
              name="assignee"
              placeholder="Список подключится позже"
              data={[]}
              // TODO: options from profiles where role = executor
            />
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
