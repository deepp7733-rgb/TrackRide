import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export function useAsync(fetcher, deps = [], enabled = true) {
  const [state, setState] = useState({ data: null, loading: Boolean(enabled), error: null });

  useEffect(() => {
    let cancelled = false;
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return () => {};
    }
    setState(s => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fetcher)
      .then(data => !cancelled && setState({ data, loading: false, error: null }))
      .catch(error => !cancelled && setState({ data: null, loading: false, error }));
    return () => { cancelled = true; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

export function useSearch(query) {
  return useAsync(
    () => api.search(query),
    [query.from, query.to, query.type, query.date],
    Boolean(query.from && query.to)
  );
}

export function useLiveTracking(vehicleId, enabled = true) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vehicleId || !enabled) {
      setData(null);
      return () => {};
    }
    let cancelled = false;
    let timer;

    const load = async () => {
      try {
        const next = await api.tracking(vehicleId);
        if (!cancelled) {
          setData(next);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) timer = setTimeout(load, 10000);
      }
    };

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [vehicleId, enabled]);

  return { data, error };
}
