import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../utils/api';

interface UseFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | Error | null;
}

export function useFetch<T>(endpoint: string | null) {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    isLoading: !!endpoint,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!endpoint) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await api.get<T>(endpoint);
      setState({ data: result, isLoading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        isLoading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}
