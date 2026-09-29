import { useEffect, useState } from 'react';

type JsonQueryResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

const useJsonQuery = <T,>(url: string): JsonQueryResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        setData((await response.json()) as T);
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(
            reason instanceof Error
              ? reason
              : new Error('Unable to load the course schedule'),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
};

export default useJsonQuery;
