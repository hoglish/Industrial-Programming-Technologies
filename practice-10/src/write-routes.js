import { ApiError } from './errors.js';
import { jsonBody } from './json-body.js';
import { requireTask } from './task-resource.js';
import { validateTaskInput } from './task-validation.js';

export function registerWriteRoutes(router, store) {
  // POST /api/tasks
  router.post('/tasks', ...jsonBody, (req, res) => {
    const categoryIds = new Set(store.listCategories().map(c => c.id));
    const value = validateTaskInput(req.body, { partial: false, categoryIds });
    const task = store.createTask(value);
    res.status(201)
      .location(`/api/tasks/${task.id}`)
      .json({ data: task });
  });

  // PATCH /api/tasks/:id
  router.patch('/tasks/:id', requireTask(store), ...jsonBody, (req, res) => {
    const categoryIds = new Set(store.listCategories().map(c => c.id));
    const changes = validateTaskInput(req.body, { partial: true, categoryIds });
    const updated = store.updateTask(req.task.id, changes);
    if (updated === null) {
      throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id: req.task.id });
    }
    res.json({ data: updated });
  });

  // DELETE /api/tasks/:id
  router.delete('/tasks/:id', requireTask(store), (req, res) => {
    const deleted = store.deleteTask(req.task.id);
    if (!deleted) {
      throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id: req.task.id });
    }
    res.status(204).end();
  });
}