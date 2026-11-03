import { useEffect, useState } from 'react';
import type { QueryResult } from '../lib/queries';

type QueryState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

export function useQuery<T>(
  query: () => Promise<QueryResult<T>>,
  deps: readonly unknown[],
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    void query().then((result) => {
      if (cancelled) return;
      if (result.error) {
        setState((current) => ({
          data: current.data,
          error: result.error,
          loading: false,
        }));
        return;
      }
      setState({ data: result.data, error: null, loading: false });
    });

    return () => {
      cancelled = true;
    };
  }, deps);

  return state;
}
