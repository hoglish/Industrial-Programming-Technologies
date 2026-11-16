import { ApiError } from './errors.js';

const PRIORITIES = new Set(['low', 'medium', 'high']);

const POST_FIELDS = new Set(['title', 'priority', 'categoryId']);
const PATCH_FIELDS = new Set(['title', 'priority', 'categoryId', 'completed']);

export function validateTaskInput(value, { partial = false, categoryIds } = {}) {
  const details = Object.create(null);

  // 1. Тело должно быть plain-объектом
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    details.body = 'Тело запроса должно быть JSON-объектом.';
    throw new ApiError(400, 'VALIDATION_ERROR', 'Данные не прошли проверку.', details);
  }

  const allowed = partial ? PATCH_FIELDS : POST_FIELDS;
  const keys = Object.keys(value);

  // 2. Неизвестные и запрещённые поля
  for (const key of keys) {
    if (allowed.has(key)) continue;

    if (key === 'id') {
      details.id = 'Поле id назначается сервером.';
    } else if (key === 'completed' && !partial) {
      details.completed = 'Поле completed назначается сервером при создании.';
    } else {
      details[key] = 'Неизвестное поле.';
    }
  }

  // 3. PATCH не должен быть пустым
  if (partial && keys.length === 0) {
    details.body = 'PATCH требует хотя бы одно поле.';
  }

  const result = {};

  // 4. title
  const hasTitle = Object.hasOwn(value, 'title');
  if (!partial && !hasTitle) {
    details.title = 'Название обязательно.';
  } else if (hasTitle) {
    if (typeof value.title !== 'string') {
      details.title = 'Название должно быть строкой.';
    } else {
      const trimmed = value.title.trim();
      if (trimmed.length < 1 || trimmed.length > 100) {
        details.title = 'Название должно быть от 1 до 100 символов.';
      } else {
        result.title = trimmed;
      }
    }
  }

  // 5. priority
  const hasPriority = Object.hasOwn(value, 'priority');
  if (!partial && !hasPriority) {
    details.priority = 'Приоритет обязателен.';
  } else if (hasPriority) {
    if (typeof value.priority !== 'string' || !PRIORITIES.has(value.priority)) {
      details.priority = 'Приоритет должен быть low, medium или high.';
    } else {
      result.priority = value.priority;
    }
  }

  // 6. categoryId
  const hasCategoryId = Object.hasOwn(value, 'categoryId');
  if (!partial && !hasCategoryId) {
    details.categoryId = 'Категория обязательна.';
  } else if (hasCategoryId) {
    const cat = value.categoryId;
    const validType = typeof cat === 'number' && Number.isSafeInteger(cat) && cat > 0;
    if (!validType) {
      details.categoryId = 'categoryId должен быть положительным целым числом.';
    } else if (categoryIds && !categoryIds.has(cat)) {
      details.categoryId = 'Неизвестная категория.';
    } else {
      result.categoryId = cat;
    }
  }

  // 7. completed — только PATCH
  if (partial && Object.hasOwn(value, 'completed')) {
    if (typeof value.completed !== 'boolean') {
      details.completed = 'completed должен быть boolean.';
    } else {
      result.completed = value.completed;
    }
  }

  // 8. Есть ошибки — выбрасываем все сразу
  if (Object.keys(details).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Данные не прошли проверку.', details);
  }

  return result;
}