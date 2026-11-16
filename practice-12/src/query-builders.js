import { notImplemented } from './errors.js';

export const taskColumns = `
  id,
  title,
  completed,
  priority,
  category_id AS "categoryId"`;

// В LIKE/ILIKE символы %, _ и \ имеют специальный смысл. API ПР10 выполнял
// буквальный поиск подстроки, поэтому перед добавлением % их нужно экранировать.
export function escapeLikePattern(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

export function buildListTasksQuery(filters) {
  const conditions = [];
  const values = [];

  if (filters.completed !== null) {
    values.push(filters.completed);
    conditions.push(`completed = $${values.length}`);
  }
  if (filters.priority !== null) {
    values.push(filters.priority);
    conditions.push(`priority = $${values.length}`);
  }
  if (filters.categoryId !== null) {
    values.push(filters.categoryId);
    conditions.push(`category_id = $${values.length}`);
  }
  if (filters.q) {
    values.push(`%${escapeLikePattern(filters.q)}%`);
    conditions.push(`title ILIKE $${values.length} ESCAPE '\\'`);
  }

  let text = `SELECT ${taskColumns} FROM public.tasks`;
  if (conditions.length > 0) {
    text += ` WHERE ${conditions.join(' AND ')}`;
  }
  text += ` ORDER BY id`;
  
  return { text, values };
}

export function buildUpdateTaskQuery(id, changes) {
  const setClauses = [];
  const values = [];
  
  const mapping = {
    title: 'title',
    completed: 'completed',
    priority: 'priority',
    categoryId: 'category_id'
  };

  for (const [jsonKey, sqlColumn] of Object.entries(mapping)) {
    if (Object.hasOwn(changes, jsonKey)) {
      values.push(changes[jsonKey]);
      setClauses.push(`${sqlColumn} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    throw new Error('Нет допустимых полей для изменения.');
  }

  values.push(id);
  const idParam = `$${values.length}`;

  const text = `UPDATE public.tasks SET ${setClauses.join(', ')} WHERE id = ${idParam} RETURNING ${taskColumns}`;
  return { text, values };
}