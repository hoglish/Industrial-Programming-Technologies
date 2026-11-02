// src/hooks/useTaskData.js
import { useEffect, useRef, useState, useCallback } from 'react';

export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);

  // Служебные ссылки
  const mountedRef = useRef(true);
  const mutationControllerRef = useRef(null);

  // Эффект монтирования для StrictMode
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Отменяем мутацию при размонтировании
      if (mutationControllerRef.current) {
        mutationControllerRef.current.abort();
        mutationControllerRef.current = null;
      }
    };
  }, []);

  // Эффект загрузки
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        const result = await api.loadInitialData(
          {
            q: filters.q,
            completed: filters.completed,
            priority: filters.priority,
            categoryId: filters.categoryId,
          },
          { signal: controller.signal }
        );
        if (active && mountedRef.current) {
          setSnapshot(result);
          setStatus('ready');
          setError(null);
        }
      } catch (err) {
        if (active && mountedRef.current && !controller.signal.aborted) {
          setError(err);
          setStatus('error');
        }
      }
    }

    setStatus('loading');
    setError(null);
    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [api, filters.q, filters.completed, filters.priority, filters.categoryId, revision]);

  // Общая функция мутации
  const mutate = useCallback(async (operation) => {
    if (!mountedRef.current || mutationControllerRef.current) {
      return false;
    }

    const controller = new AbortController();
    mutationControllerRef.current = controller;
    setPending(true);
    setMutationError(null);

    try {
      await operation(controller.signal);
      if (!mountedRef.current) return false;
      setRevision((r) => r + 1);
      return true;
    } catch (err) {
      if (mountedRef.current) {
        setMutationError(err);
      }
      return false;
    } finally {
      if (mutationControllerRef.current === controller) {
        mutationControllerRef.current = null;
      }
      if (mountedRef.current) {
        setPending(false);
      }
    }
  }, []);

  // Методы
  const refresh = useCallback(() => {
    setRevision((r) => r + 1);
  }, []);

  const saveTask = useCallback(
    (id, value) => {
      return mutate((signal) => {
        if (id === null) {
          return api.createTask(value, { signal });
        }
        return api.updateTask(id, value, { signal });
      });
    },
    [api, mutate]
  );

  const toggleTask = useCallback(
    (task) => {
      return mutate((signal) => api.setTaskCompleted(task.id, !task.completed, { signal }));
    },
    [api, mutate]
  );

  const deleteTask = useCallback(
    (id) => {
      return mutate((signal) => api.deleteTask(id, { signal }));
    },
    [api, mutate]
  );

  const resetData = useCallback(() => {
    return mutate((signal) => api.resetDemoData({ signal }));
  }, [api, mutate]);

  return {
    snapshot,
    status,
    error,
    mutationError,
    pending,
    refresh,
    saveTask,
    toggleTask,
    deleteTask,
    resetData,
  };
}