export type UserRole = 'assigner' | 'executor';

export type TaskStatus = 'new' | 'in_progress' | 'in_review' | 'accepted' | 'rework';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
};

export type SiteRow = {
  id: string;
  name: string;
  address: string;
  created_by: string;
  created_at: string;
};

export type TaskRow = {
  id: string;
  site_id: string;
  title: string;
  description: string;
  assignee_id: string;
  author_id: string;
  status: TaskStatus;
  created_at: string;
};

export type TaskEventRow = {
  id: string;
  task_id: string;
  actor_id: string;
  from_status: TaskStatus | null;
  to_status: TaskStatus;
  comment: string | null;
  created_at: string;
};

type Table<
  Row extends Record<string, unknown>,
  Rel extends readonly unknown[] = [],
  Insert = Partial<Row>,
  Update = Partial<Row>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Rel;
};

/** Client writes are closed. Status changes go through transition_task. */
type NoClientWrite = Record<string, never>;

export type SiteInsert = {
  name: string;
  address: string;
};

export type SiteUpdate = {
  name?: string;
  address?: string;
};

export type TaskInsert = {
  site_id: string;
  title: string;
  description?: string;
  assignee_id: string;
};

export type TaskUpdate = {
  title?: string;
  description?: string;
  assignee_id?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, [], NoClientWrite, NoClientWrite>;
      sites: Table<
        SiteRow,
        [
          {
            foreignKeyName: 'sites_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ],
        SiteInsert,
        SiteUpdate
      >;
      tasks: Table<
        TaskRow,
        [
          {
            foreignKeyName: 'tasks_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: true;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_assignee_id_fkey';
            columns: ['assignee_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ],
        TaskInsert,
        TaskUpdate
      >;
      task_status_events: Table<
        TaskEventRow,
        [
          {
            foreignKeyName: 'task_status_events_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: true;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_status_events_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ],
        NoClientWrite,
        NoClientWrite
      >;
    };
    Views: Record<string, never>;
    Functions: {
      transition_task: {
        Args: {
          p_task_id: string;
          p_to_status: TaskStatus;
          p_comment?: string | null;
        };
        Returns: TaskRow;
      };
    };
    Enums: {
      user_role: UserRole;
      task_status: TaskStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
