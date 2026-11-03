import { Anchor, Table } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ErrorText, PageLoader } from '../components/PageStatus';
import { TASK_STATUS_LABEL } from '../domain/labels';
import { useQuery } from '../hooks/useQuery';
import { fetchMyTasks } from '../lib/queries';
import layout from '../styles/layout.module.scss';

export function MyTasksPage() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const { data, error, loading } = useQuery(() => fetchMyTasks(userId), [userId]);
  const tasks = data ?? [];

  return (
    <section className={layout.page}>
      <header className={layout.toolbar}>
        <h1 className={layout.title}>Мои задачи</h1>
      </header>
      <p className={layout.muted}>Только задачи, где вы назначены исполнителем.</p>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {loading && data === null ? <PageLoader /> : null}
      {!loading && !error && tasks.length === 0 ? (
        <p className={layout.muted}>Вам пока не назначили задач</p>
      ) : null}
      {tasks.length > 0 ? (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Объект</Table.Th>
              <Table.Th>Статус</Table.Th>
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
                <Table.Td>
                  <Anchor component={Link} to={`/sites/${task.site_id}`}>
                    {task.siteName ?? 'Объект'}
                  </Anchor>
                </Table.Td>
                <Table.Td>{TASK_STATUS_LABEL[task.status]}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : null}
    </section>
  );
}
