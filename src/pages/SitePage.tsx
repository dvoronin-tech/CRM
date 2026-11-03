import { Anchor, Button, Group, Modal, Stack, Table } from '@mantine/core';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ErrorText, PageLoader } from '../components/PageStatus';
import { SiteFormModal } from '../components/SiteFormModal';
import { TaskFormModal, type TaskFormValue } from '../components/TaskFormModal';
import { TASK_STATUS_LABEL } from '../domain/labels';
import { useQuery } from '../hooks/useQuery';
import {
  createTask,
  deleteSite,
  deleteTask,
  fetchExecutors,
  fetchSiteDetail,
  updateSite,
  updateTask,
  type TaskListItem,
} from '../lib/queries';
import layout from '../styles/layout.module.scss';

const EMPTY_TASK: TaskFormValue & { assigneeName: string | null } = {
  title: '',
  description: '',
  assigneeId: '',
  assigneeName: null,
};

export function SitePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [siteFormOpened, setSiteFormOpened] = useState(false);
  const [deleteSiteOpened, setDeleteSiteOpened] = useState(false);
  const [deleteSiteError, setDeleteSiteError] = useState<string | null>(null);
  const [deletingSite, setDeletingSite] = useState(false);
  const [taskMode, setTaskMode] = useState<'create' | 'edit' | null>(null);
  const [editingTask, setEditingTask] = useState<TaskListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskListItem | null>(null);
  const [deleteTaskError, setDeleteTaskError] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const isAssigner = profile?.role === 'assigner';
  const { data, error, loading } = useQuery(
    () =>
      profile
        ? fetchSiteDetail(id, { id: profile.id, role: profile.role })
        : Promise.resolve({ data: { site: null, tasks: [] }, error: null }),
    [id, profile?.id, profile?.role, reloadKey],
  );
  const executorsQuery = useQuery(
    () => (isAssigner ? fetchExecutors() : Promise.resolve({ data: [], error: null })),
    [isAssigner],
  );

  function refresh() {
    setReloadKey((value) => value + 1);
  }

  async function handleSaveSite(name: string, address: string) {
    const result = await updateSite(id, name, address);
    if (result.error) return result.error;
    refresh();
    return null;
  }

  function closeDeleteSite() {
    if (deletingSite) return;
    setDeleteSiteOpened(false);
    setDeleteSiteError(null);
  }

  async function handleDeleteSite() {
    setDeletingSite(true);
    setDeleteSiteError(null);
    const result = await deleteSite(id);
    setDeletingSite(false);
    if (result.error) {
      setDeleteSiteError(result.error);
      return;
    }
    navigate('/sites', { replace: true });
  }

  function openCreateTask() {
    setEditingTask(null);
    setTaskMode('create');
  }

  function openEditTask(task: TaskListItem) {
    setEditingTask(task);
    setTaskMode('edit');
  }

  function closeTaskForm() {
    setTaskMode(null);
  }

  async function handleSaveTask(value: TaskFormValue) {
    if (taskMode === 'edit' && editingTask) {
      const result = await updateTask(editingTask.id, value);
      if (result.error) return result.error;
      refresh();
      return null;
    }

    const result = await createTask(id, value);
    if (result.error) return result.error;
    refresh();
    return null;
  }

  function openDeleteTask(task: TaskListItem) {
    setDeleteTaskError(null);
    setDeleteTarget(task);
  }

  function closeDeleteTask() {
    if (deletingTask) return;
    setDeleteTarget(null);
    setDeleteTaskError(null);
  }

  async function handleDeleteTask() {
    if (!deleteTarget) return;
    setDeletingTask(true);
    setDeleteTaskError(null);
    const result = await deleteTask(deleteTarget.id);
    setDeletingTask(false);
    if (result.error) {
      setDeleteTaskError(result.error);
      return;
    }
    setDeleteTarget(null);
    refresh();
  }

  if (loading && data === null) return <PageLoader />;
  if (error && data === null) return <ErrorText>{error}</ErrorText>;
  if (!data?.site) return <p className={layout.muted}>Объект не найден</p>;

  const { site, tasks } = data;
  const executorOptions = (executorsQuery.data ?? []).map((executor) => ({
    value: executor.id,
    label: executor.fullName,
  }));
  const taskInitial = editingTask
    ? {
        title: editingTask.title,
        description: editingTask.description,
        assigneeId: editingTask.assignee_id,
        assigneeName: editingTask.assigneeName,
      }
    : EMPTY_TASK;

  return (
    <section className={layout.page}>
      <header className={layout.toolbar}>
        <div>
          <h1 className={layout.title}>{site.name}</h1>
          <p className={layout.muted}>{site.address}</p>
        </div>
        {isAssigner ? (
          <div className={layout.actions}>
            <Button type="button" variant="default" onClick={() => setSiteFormOpened(true)}>
              Изменить
            </Button>
            <Button type="button" onClick={openCreateTask}>
              Новая задача
            </Button>
            <Button type="button" className={layout.danger} onClick={() => setDeleteSiteOpened(true)}>
              Удалить
            </Button>
          </div>
        ) : null}
      </header>
      <p>
        <Anchor component={Link} to="/sites">
          К объектам
        </Anchor>
      </p>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <h2 className={layout.title}>Задачи</h2>
      {tasks.length === 0 ? (
        <p className={layout.muted}>
          {isAssigner ? 'На этом объекте задач пока нет' : 'На этом объекте у вас нет задач'}
        </p>
      ) : null}
      {tasks.length > 0 ? (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th>Исполнитель</Table.Th>
              {isAssigner ? <Table.Th>Действия</Table.Th> : null}
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
                {isAssigner ? (
                  <Table.Td>
                    <div className={layout.actions}>
                      <Button type="button" variant="default" onClick={() => openEditTask(task)}>
                        Изменить
                      </Button>
                      <Button type="button" className={layout.danger} onClick={() => openDeleteTask(task)}>
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
        opened={siteFormOpened}
        mode="edit"
        formKey={site.id}
        initialName={site.name}
        initialAddress={site.address}
        onClose={() => setSiteFormOpened(false)}
        onSubmit={handleSaveSite}
      />
      <TaskFormModal
        opened={taskMode !== null}
        mode={taskMode === 'edit' ? 'edit' : 'create'}
        formKey={editingTask?.id ?? 'new'}
        initial={taskInitial}
        executors={executorOptions}
        executorsLoading={executorsQuery.loading && executorsQuery.data === null}
        executorsError={executorsQuery.error}
        onClose={closeTaskForm}
        onSubmit={handleSaveTask}
      />
      <Modal opened={deleteSiteOpened} onClose={closeDeleteSite} title="Удалить объект?">
        <Stack gap="md">
          <p className={layout.muted}>
            Вместе с объектом удалятся его задачи и их история. Это действие нельзя отменить.
          </p>
          {deleteSiteError ? <ErrorText>{deleteSiteError}</ErrorText> : null}
          <Group justify="flex-end" gap="sm">
            <Button type="button" variant="default" onClick={closeDeleteSite}>
              Отмена
            </Button>
            <Button
              type="button"
              className={layout.danger}
              loading={deletingSite}
              onClick={() => void handleDeleteSite()}
            >
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Modal opened={deleteTarget !== null} onClose={closeDeleteTask} title="Удалить задачу?">
        <Stack gap="md">
          <p className={layout.muted}>Вместе с задачей удалится её история. Это действие нельзя отменить.</p>
          {deleteTaskError ? <ErrorText>{deleteTaskError}</ErrorText> : null}
          <Group justify="flex-end" gap="sm">
            <Button type="button" variant="default" onClick={closeDeleteTask}>
              Отмена
            </Button>
            <Button
              type="button"
              className={layout.danger}
              loading={deletingTask}
              onClick={() => void handleDeleteTask()}
            >
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </section>
  );
}
