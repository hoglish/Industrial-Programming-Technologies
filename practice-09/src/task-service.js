// src/task-service.js

export function selectTasks(tasks, filters) {
  const { completed, priority, categoryId, q } = filters;
  const needle = q ? q.toLocaleLowerCase('ru-RU') : '';

  return tasks.filter(task => {
    if (completed !== null && task.completed !== completed) return false;
    if (priority !== null && task.priority !== priority) return false;
    if (categoryId !== null && task.categoryId !== categoryId) return false;
    if (needle && !task.title.toLocaleLowerCase('ru-RU').includes(needle)) return false;
    return true;
  });
}

export function findTask(tasks, id) {
  return tasks.find(task => task.id === id) ?? null;
}