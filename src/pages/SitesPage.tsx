import { Button, Group, Modal, Stack, Table, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { type FormEvent } from 'react';
import layout from '../styles/layout.module.scss';

export function SitesPage() {
  const [opened, { open, close }] = useDisclosure(false);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: insert name and address into public.sites with created_by = current profile.
    close();
  }

  return (
    <section className={layout.page}>
      <header className={layout.toolbar}>
        <h1 className={layout.title}>Объекты</h1>
        <Button type="button" onClick={open}>
          Новый объект
        </Button>
      </header>
      <p className={layout.muted}>
        Постановщик видит все стройки. Исполнитель — только объекты, где у него есть задачи.
      </p>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th>Адрес</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {/* TODO: map rows from supabase.from('sites') and link each name to /sites/:id */}
          <Table.Tr>
            <Table.Td colSpan={2}>Список появится после подключения данных.</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
      <Modal opened={opened} onClose={close} title="Новый объект">
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <TextInput label="Название" name="name" required />
            <TextInput label="Адрес" name="address" required />
            <Group justify="flex-end" gap="sm">
              <Button type="button" variant="default" onClick={close}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </section>
  );
}
