import { Anchor, Button, Group, Modal, Stack, Table } from '@mantine/core';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { SiteFormModal } from '../components/SiteFormModal';
import { ErrorText, PageLoader } from '../components/PageStatus';
import { useQuery } from '../hooks/useQuery';
import { createSite, deleteSite, fetchSites, updateSite, type SiteListItem } from '../lib/queries';
import layout from '../styles/layout.module.scss';

const EMPTY_SITE = { name: '', address: '' };

export function SitesPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpened, setFormOpened] = useState(false);
  const [editing, setEditing] = useState<SiteListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SiteListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isAssigner = profile?.role === 'assigner';
  const { data, error, loading } = useQuery(
    () => (profile ? fetchSites({ id: profile.id, role: profile.role }) : Promise.resolve({ data: [], error: null })),
    [profile?.id, profile?.role, reloadKey],
  );
  const sites = data ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpened(true);
  }

  function openEdit(site: SiteListItem) {
    setEditing(site);
    setFormOpened(true);
  }

  function closeForm() {
    setFormOpened(false);
  }

  async function handleSave(name: string, address: string) {
    if (editing) {
      const result = await updateSite(editing.id, name, address);
      if (result.error) return result.error;
      setReloadKey((value) => value + 1);
      return null;
    }

    const result = await createSite(name, address);
    if (result.error || !result.data) return result.error ?? 'Не удалось сохранить';
    navigate(`/sites/${result.data.id}`);
    return null;
  }

  function openDelete(site: SiteListItem) {
    setDeleteError(null);
    setDeleteTarget(site);
  }

  function closeDelete() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteSite(deleteTarget.id);
    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    setDeleteTarget(null);
    setReloadKey((value) => value + 1);
  }

  const formInitial = editing ?? EMPTY_SITE;

  return (
    <section className={layout.page}>
      <header className={layout.toolbar}>
        <h1 className={layout.title}>Объекты</h1>
        {isAssigner ? (
          <Button type="button" onClick={openCreate}>
            Новый объект
          </Button>
        ) : null}
      </header>
      <p className={layout.muted}>
        {isAssigner
          ? 'Все стройки. Задачи открываются в карточке объекта.'
          : 'Только объекты, где у вас есть задачи.'}
      </p>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {loading && data === null ? <PageLoader /> : null}
      {profile && !loading && !error && sites.length === 0 ? (
        <p className={layout.muted}>
          {isAssigner ? 'Объектов пока нет' : 'Объектов с вашими задачами пока нет'}
        </p>
      ) : null}
      {sites.length > 0 ? (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Адрес</Table.Th>
              {isAssigner ? <Table.Th>Действия</Table.Th> : null}
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
                {isAssigner ? (
                  <Table.Td>
                    <div className={layout.actions}>
                      <Button type="button" variant="default" onClick={() => openEdit(site)}>
                        Изменить
                      </Button>
                      <Button type="button" className={layout.danger} onClick={() => openDelete(site)}>
                        Удалить
                      </Button>
                    </div>
                  </Table.Td>
                ) : null}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : null}
      <SiteFormModal
        opened={formOpened}
        mode={editing ? 'edit' : 'create'}
        formKey={editing?.id ?? 'new'}
        initialName={formInitial.name}
        initialAddress={formInitial.address}
        onClose={closeForm}
        onSubmit={handleSave}
      />
      <Modal opened={deleteTarget !== null} onClose={closeDelete} title="Удалить объект?">
        <Stack gap="md">
          <p className={layout.muted}>
            Вместе с объектом удалятся его задачи и их история. Это действие нельзя отменить.
          </p>
          {deleteError ? <ErrorText>{deleteError}</ErrorText> : null}
          <Group justify="flex-end" gap="sm">
            <Button type="button" variant="default" onClick={closeDelete}>
              Отмена
            </Button>
            <Button type="button" className={layout.danger} loading={deleting} onClick={() => void handleDelete()}>
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </section>
  );
}
