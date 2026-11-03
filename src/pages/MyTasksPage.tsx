import { Table } from '@mantine/core';
import layout from '../styles/layout.module.scss';

export function MyTasksPage() {
  return (
    <section className={layout.page}>
      <header className={layout.toolbar}>
        <h1 className={layout.title}>Мои задачи</h1>
      </header>
      <p className={layout.muted}>Основной экран исполнителя: только задачи, назначенные ему.</p>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th>Объект</Table.Th>
            <Table.Th>Статус</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {/* TODO: tasks where assignee_id = auth user. Link the title to /tasks/:id */}
          <Table.Tr>
            <Table.Td colSpan={3}>Задачи появятся после подключения данных.</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </section>
  );
}
