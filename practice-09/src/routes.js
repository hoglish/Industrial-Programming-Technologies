// src/routes.js
import { Router } from 'express';
import { ApiError } from './errors.js';
import { parsePositiveId, parseFilters } from './validation.js';

export function createRouter(store) {
  const router = Router({ caseSensitive: true });

  // GET /api/health
  router.get('/health', (req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  // GET /api/categories
  router.get('/categories', (req, res) => {
    const categories = store.listCategories();
    res.json({ data: categories, meta: { total: categories.length } });
  });

  // GET /api/tasks
  router.get('/tasks', (req, res) => {
    const url = new URL(req.originalUrl, 'http://localhost');
    const filters = parseFilters(url.searchParams);
    const tasks = store.listTasks(filters);
    res.json({
      data: tasks,
      meta: { total: tasks.length, filters },
    });
  });

  // GET /api/tasks/:id
  router.get('/tasks/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id === null) {
      throw new ApiError(400, 'INVALID_ID', 'id должен быть положительным целым числом.');
    }
    const task = store.getTask(id);
    if (task === null) {
      throw new ApiError(404, 'TASK_NOT_FOUND', `Задача с id ${id} не найдена.`, { id });
    }
    res.json({ data: task });
  });

  // 405 METHOD_NOT_ALLOWED для известных путей
  // OPTIONS уже обработан в app.js, HEAD поддерживается GET-маршрутами автоматически
  const methodNotAllowed = (req, res, next) => {
    res.set('Allow', 'GET, HEAD, OPTIONS');
    next(new ApiError(405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается.'));
  };

  router.all('/health', methodNotAllowed);
  router.all('/categories', methodNotAllowed);
  router.all('/tasks', methodNotAllowed);
  router.all('/tasks/:id', methodNotAllowed);

  return router;
}