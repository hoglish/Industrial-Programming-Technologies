// src/validation.js
import { ApiError } from './errors.js';

const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high']);
const ALLOWED_FILTER_NAMES = new Set(['completed', 'priority', 'categoryId', 'q']);

// raw: строка; результат: безопасное положительное целое либо null.
export function parsePositiveId(raw) {
  if (typeof raw !== 'string') return null;
  // Строгое соответствие: только цифры без ведущих нулей
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  // Проверка на безопасное целое (не больше Number.MAX_SAFE_INTEGER)
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

// URLSearchParams -> { completed, priority, categoryId, q }
export function parseFilters(searchParams) {
  // 1. Проверить имена всех параметров и отсутствие повторов
  const seen = new Set();
  for (const key of searchParams.keys()) {
    if (!ALLOWED_FILTER_NAMES.has(key)) {
      throw new ApiError(400, 'INVALID_QUERY', `Неизвестный параметр: ${key}.`);
    }
    if (seen.has(key)) {
      throw new ApiError(400, 'INVALID_QUERY', `Параметр ${key} нельзя повторять.`);
    }
    seen.add(key);
  }

  const filters = { completed: null, priority: null, categoryId: null, q: '' };

  // 2. completed: строго 'true' или 'false'
  if (searchParams.has('completed')) {
    const raw = searchParams.get('completed');
    if (raw === '') {
      throw new ApiError(400, 'INVALID_QUERY', 'completed не может быть пустым.');
    }
    if (raw !== 'true' && raw !== 'false') {
      throw new ApiError(400, 'INVALID_QUERY', 'completed должен быть true или false.');
    }
    filters.completed = raw === 'true';
  }

  // 3. priority: low, medium, high (с учётом регистра)
  if (searchParams.has('priority')) {
    const raw = searchParams.get('priority');
    if (raw === '') {
      throw new ApiError(400, 'INVALID_QUERY', 'priority не может быть пустым.');
    }
    if (!ALLOWED_PRIORITIES.has(raw)) {
      throw new ApiError(400, 'INVALID_QUERY', 'priority должен быть low, medium или high.');
    }
    filters.priority = raw;
  }

  // 4. categoryId: положительное целое без ведущих нулей
  if (searchParams.has('categoryId')) {
    const raw = searchParams.get('categoryId');
    if (raw === '') {
      throw new ApiError(400, 'INVALID_QUERY', 'categoryId не может быть пустым.');
    }
    const parsed = parsePositiveId(raw);
    if (parsed === null) {
      throw new ApiError(400, 'INVALID_QUERY', 'categoryId должен быть положительным целым числом.');
    }
    filters.categoryId = parsed;
  }

  // 5. q: trim, длина <= 100 после trim
  if (searchParams.has('q')) {
    const raw = searchParams.get('q') ?? '';
    const trimmed = raw.trim();
    if (trimmed.length > 100) {
      throw new ApiError(400, 'INVALID_QUERY', 'q не должен быть длиннее 100 символов.');
    }
    filters.q = trimmed;
  }

  return filters;
}