import { categories as seedCategories, tasks as seedTasks } from './data.js';
import { selectTasks, findTask } from './task-service.js';

const noFilters = { completed: null, priority: null, categoryId: null, q: '' };

export function createStore() {
  let tasks;
  let nextId;
  const categories = seedCategories.map(item => ({ ...item }));

  function reset() {
    tasks = seedTasks.map(item => ({ ...item }));
    nextId = Math.max(0, ...tasks.map(item => item.id)) + 1;
    return { reset: true, total: tasks.length };
  }

  reset();

  return {
    listTasks: (filters = noFilters) => selectTasks(tasks, filters).map(item => ({ ...item })),
    getTask: id => { const task = findTask(tasks, id); return task ? { ...task } : null; },
    listCategories: () => categories.map(item => ({ ...item })),
    reset,

    createTask(value) {
      const task = {
        id: nextId,
        title: value.title,
        completed: false,
        priority: value.priority,
        categoryId: value.categoryId,
      };
      tasks.push(task);
      nextId += 1;
      return { ...task };
    },

    updateTask(id, changes) {
      const task = findTask(tasks, id);
      if (!task) return null;

      if (Object.hasOwn(changes, 'title')) task.title = changes.title;
      if (Object.hasOwn(changes, 'priority')) task.priority = changes.priority;
      if (Object.hasOwn(changes, 'categoryId')) task.categoryId = changes.categoryId;
      if (Object.hasOwn(changes, 'completed')) task.completed = changes.completed;

      return { ...task };
    },

    deleteTask(id) {
      const index = tasks.findIndex(task => task.id === id);
      if (index === -1) return false;
      tasks.splice(index, 1);
      return true;
    },
  };
}