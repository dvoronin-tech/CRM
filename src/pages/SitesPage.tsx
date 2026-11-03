import { Anchor, Button, Group, Modal, Stack, Table, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorText, PageLoader } from '../components/PageStatus';
import { useQuery } from '../hooks/useQuery';
import { fetchSites } from '../lib/queries';
import layout from '../styles/layout.module.scss';

export function SitesPage() {
  const [opened, { open, close }] = useDisclosure(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { data, error, loading } = useQuery(() => fetchSites(), []);
  const sites = data ?? [];

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: insert name and address into public.sites with created_by = current profile.
    setNotice('Создание объекта пока не подключено');
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
      {error ? <ErrorText>{error}</ErrorText> : null}
      {loading && data === null ? <PageLoader /> : null}
      {!loading && !error && sites.length === 0 ? <p className={layout.muted}>Объектов пока нет</p> : null}
      {sites.length > 0 ? (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Адрес</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sites.map((site) => (
              <Table.Tr key={site.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/sites/${site.id}`}>
                    {site.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>{site.address}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : null}
      <Modal opened={opened} onClose={close} title="Новый объект">
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <TextInput label="Название" name="name" required />
            <TextInput label="Адрес" name="address" required />
            {notice ? <ErrorText>{notice}</ErrorText> : null}
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
