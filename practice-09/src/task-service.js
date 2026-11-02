// src/task-service.js

// Все фильтры объединяются через И. Исходный массив не изменяется.
export function selectTasks(tasks, filters) {
  const { completed, priority, categoryId, q } = filters;
  const needle = q ? q.toLocaleLowerCase('ru-RU') : '';

  return tasks.filter(task => {
    // completed: null означает "без фильтра"
    if (completed !== null && task.completed !== completed) return false;
    // priority: null означает "без фильтра"
    if (priority !== null && task.priority !== priority) return false;
    // categoryId: null означает "без фильтра"
    if (categoryId !== null && task.categoryId !== categoryId) return false;
    // q: пустая строка означает "без поиска"
    if (needle && !task.title.toLocaleLowerCase('ru-RU').includes(needle)) return false;
    return true;
  });
}

// Поиск по полю id, не по индексу. Возвращает задачу или null.
export function findTask(tasks, id) {
  return tasks.find(task => task.id === id) ?? null;
}