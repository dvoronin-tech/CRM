import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, TaskStatus, UserRole } from './database';
import { embedOne } from './format';
import { CONFIG_ERROR, loadErrorMessage, mutationErrorMessage, transitionErrorMessage } from './messages';
import { getSupabase } from './supabase';

export type QueryResult<T> = {
  data: T | null;
  error: string | null;
};

export type SiteListItem = {
  id: string;
  name: string;
  address: string;
  created_at: string;
};

export type TaskListItem = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  created_at: string;
  assignee_id: string;
  assigneeName: string | null;
};

export type ExecutorOption = {
  id: string;
  fullName: string;
};

export type MyTaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  created_at: string;
  site_id: string;
  siteName: string | null;
};

export type TaskDetail = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  created_at: string;
  site_id: string;
  assignee_id: string;
  author_id: string;
  siteName: string | null;
  siteAddress: string | null;
  assigneeName: string | null;
  authorName: string | null;
};

export type HistoryItem = {
  id: string;
  from_status: TaskStatus | null;
  to_status: TaskStatus;
  comment: string | null;
  created_at: string;
  actorName: string | null;
};

const SITE_LIST = 'id, name, address, created_at' as const;

const TASK_LIST =
  'id, title, description, status, created_at, assignee_id, assignee:profiles!tasks_assignee_id_fkey(full_name)' as const;

const MY_TASKS =
  'id, title, status, created_at, site_id, site:sites!tasks_site_id_fkey(id, name)' as const;

const TASK_DETAIL =
  'id, title, description, status, created_at, site_id, assignee_id, author_id, site:sites!tasks_site_id_fkey(id, name, address), assignee:profiles!tasks_assignee_id_fkey(id, full_name), author:profiles!tasks_author_id_fkey(id, full_name)' as const;

const HISTORY =
  'id, from_status, to_status, comment, created_at, actor:profiles!task_status_events_actor_id_fkey(full_name)' as const;

async function withClient<T>(
  run: (client: SupabaseClient<Database>) => Promise<QueryResult<T>>,
): Promise<QueryResult<T>> {
  try {
    return await run(getSupabase());
  } catch (error) {
    if (error instanceof Error && error.message.includes('VITE_SUPABASE')) {
      return { data: null, error: CONFIG_ERROR };
    }
    return { data: null, error: 'Не удалось загрузить данные' };
  }
}

export function fetchSites(viewer: { id: string; role: UserRole }): Promise<QueryResult<SiteListItem[]>> {
  return withClient(async (supabase) => {
    if (viewer.role === 'executor') {
      const { data: taskRows, error: taskError } = await supabase
        .from('tasks')
        .select('site_id')
        .eq('assignee_id', viewer.id);
      if (taskError) return { data: null, error: loadErrorMessage(taskError) };
      const siteIds = [...new Set((taskRows ?? []).map((row) => row.site_id))];
      if (siteIds.length === 0) return { data: [], error: null };
      const { data, error } = await supabase
        .from('sites')
        .select(SITE_LIST)
        .in('id', siteIds)
        .order('name', { ascending: true });
      if (error) return { data: null, error: loadErrorMessage(error) };
      return { data: data ?? [], error: null };
    }

    const { data, error } = await supabase.from('sites').select(SITE_LIST).order('name', { ascending: true });
    if (error) return { data: null, error: loadErrorMessage(error) };
    return { data: data ?? [], error: null };
  });
}

export function fetchSiteDetail(
  siteId: string,
  viewer: { id: string; role: UserRole } | null,
): Promise<QueryResult<{ site: SiteListItem | null; tasks: TaskListItem[] }>> {
  return withClient(async (supabase) => {
    let tasksQuery = supabase
      .from('tasks')
      .select(TASK_LIST)
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (viewer?.role === 'executor') {
      tasksQuery = tasksQuery.eq('assignee_id', viewer.id);
    }

    const [siteResult, taskResult] = await Promise.all([
      supabase.from('sites').select(SITE_LIST).eq('id', siteId).maybeSingle(),
      tasksQuery,
    ]);

    if (siteResult.error) return { data: null, error: loadErrorMessage(siteResult.error) };
    if (taskResult.error) return { data: null, error: loadErrorMessage(taskResult.error) };

    const tasks = (taskResult.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      created_at: row.created_at,
      assignee_id: row.assignee_id,
      assigneeName: embedOne(row.assignee)?.full_name ?? null,
    }));

    if (viewer?.role === 'executor' && tasks.length === 0) {
      return { data: { site: null, tasks: [] }, error: null };
    }

    return {
      data: {
        site: siteResult.data,
        tasks,
      },
      error: null,
    };
  });
}

export function fetchExecutors(): Promise<QueryResult<ExecutorOption[]>> {
  return withClient(async (supabase) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'executor')
      .order('full_name', { ascending: true });
    if (error) return { data: null, error: loadErrorMessage(error) };
    return {
      data: (data ?? []).map((row) => ({ id: row.id, fullName: row.full_name })),
      error: null,
    };
  });
}

export function fetchMyTasks(userId: string): Promise<QueryResult<MyTaskItem[]>> {
  return withClient(async (supabase) => {
    const { data, error } = await supabase
      .from('tasks')
      .select(MY_TASKS)
      .eq('assignee_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: loadErrorMessage(error) };

    return {
      data: (data ?? []).map((row) => {
        const site = embedOne(row.site);
        return {
          id: row.id,
          title: row.title,
          status: row.status,
          created_at: row.created_at,
          site_id: row.site_id,
          siteName: site?.name ?? null,
        };
      }),
      error: null,
    };
  });
}

export function fetchTask(
  taskId: string,
): Promise<QueryResult<{ task: TaskDetail | null; history: HistoryItem[] }>> {
  return withClient(async (supabase) => {
    const [taskResult, historyResult] = await Promise.all([
      supabase.from('tasks').select(TASK_DETAIL).eq('id', taskId).maybeSingle(),
      supabase
        .from('task_status_events')
        .select(HISTORY)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true }),
    ]);

    if (taskResult.error) return { data: null, error: loadErrorMessage(taskResult.error) };
    if (historyResult.error) return { data: null, error: loadErrorMessage(historyResult.error) };

    const row = taskResult.data;
    const site = row ? embedOne(row.site) : null;
    const assignee = row ? embedOne(row.assignee) : null;
    const author = row ? embedOne(row.author) : null;

    return {
      data: {
        task: row
          ? {
              id: row.id,
              title: row.title,
              description: row.description,
              status: row.status,
              created_at: row.created_at,
              site_id: row.site_id,
              assignee_id: row.assignee_id,
              author_id: row.author_id,
              siteName: site?.name ?? null,
              siteAddress: site?.address ?? null,
              assigneeName: assignee?.full_name ?? null,
              authorName: author?.full_name ?? null,
            }
          : null,
        history: (historyResult.data ?? []).map((event) => ({
          id: event.id,
          from_status: event.from_status,
          to_status: event.to_status,
          comment: event.comment,
          created_at: event.created_at,
          actorName: embedOne(event.actor)?.full_name ?? null,
        })),
      },
      error: null,
    };
  });
}

/**
 * Calls the MVP `transition_task` stub.
 * TODO(security): the SQL function only writes `tasks.status` and ignores
 * role, the allowed edge, the comment, and `task_status_events`.
 * Keep this call when the security pass replaces the function body.
 */
export function transitionTask(
  taskId: string,
  toStatus: TaskStatus,
  comment: string | null,
): Promise<QueryResult<true>> {
  return withClient(async (supabase) => {
    const { error } = await supabase.rpc('transition_task', {
      p_task_id: taskId,
      p_to_status: toStatus,
      p_comment: comment,
    });
    if (error) return { data: null, error: transitionErrorMessage(error) };
    return { data: true, error: null };
  });
}

function expectWrite(
  error: { message: string; code?: string } | null,
  rows: readonly { id: string }[] | null,
  emptyMessage: string,
  fallback = 'Не удалось сохранить',
): QueryResult<true> {
  if (error) return { data: null, error: mutationErrorMessage(error, fallback) };
  if (!rows?.length) return { data: null, error: emptyMessage };
  return { data: true, error: null };
}

export function createSite(name: string, address: string): Promise<QueryResult<{ id: string }>> {
  return withClient(async (supabase) => {
    const { data, error } = await supabase.from('sites').insert({ name, address }).select('id').single();
    if (error) return { data: null, error: mutationErrorMessage(error) };
    return { data: { id: data.id }, error: null };
  });
}

export function updateSite(siteId: string, name: string, address: string): Promise<QueryResult<true>> {
  return withClient(async (supabase) => {
    const { data, error } = await supabase.from('sites').update({ name, address }).eq('id', siteId).select('id');
    return expectWrite(error, data, 'Объект не найден');
  });
}

export function deleteSite(siteId: string): Promise<QueryResult<true>> {
  return withClient(async (supabase) => {
    const { data, error } = await supabase.from('sites').delete().eq('id', siteId).select('id');
    return expectWrite(error, data, 'Объект не найден', 'Не удалось удалить');
  });
}

export function createTask(
  siteId: string,
  input: { title: string; description: string; assigneeId: string },
): Promise<QueryResult<{ id: string }>> {
  return withClient(async (supabase) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        site_id: siteId,
        title: input.title,
        description: input.description,
        assignee_id: input.assigneeId,
      })
      .select('id')
      .single();
    if (error) return { data: null, error: mutationErrorMessage(error) };
    return { data: { id: data.id }, error: null };
  });
}

export function updateTask(
  taskId: string,
  input: { title: string; description: string; assigneeId: string },
): Promise<QueryResult<true>> {
  return withClient(async (supabase) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: input.title,
        description: input.description,
        assignee_id: input.assigneeId,
      })
      .eq('id', taskId)
      .select('id');
    return expectWrite(error, data, 'Задача не найдена');
  });
}

export function deleteTask(taskId: string): Promise<QueryResult<true>> {
  return withClient(async (supabase) => {
    const { data, error } = await supabase.from('tasks').delete().eq('id', taskId).select('id');
    return expectWrite(error, data, 'Задача не найдена', 'Не удалось удалить');
  });
}
