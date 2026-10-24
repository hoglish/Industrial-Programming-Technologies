// src/form-validation.js
const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, categories) {
  const errors = {};

  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return { valid: false, value: null, errors: { title: "Данные формы отсутствуют." } };
  }

  // Проверка title
  const rawTitle = draft.title;
  let title = "";
  if (typeof rawTitle !== "string") {
    errors.title = "Название должно быть строкой.";
  } else {
    title = rawTitle.trim();
    if (title.length < 1 || title.length > 100) {
      errors.title = "Название должно содержать от 1 до 100 символов.";
    }
  }

  // Проверка priority
  const priority = draft.priority;
  if (typeof priority !== "string" || !ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Приоритет должен быть low, medium или high.";
  }

  // Проверка categoryId
  const rawCategoryId = draft.categoryId;
  let categoryId;
  if (rawCategoryId === "" || rawCategoryId === null || rawCategoryId === undefined) {
    errors.categoryId = "Выберите категорию.";
  } else {
    categoryId = Number(rawCategoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      errors.categoryId = "Категория должна быть положительным целым числом.";
    } else {
      const categoryIds = new Set((categories ?? []).map((c) => c.id));
      if (!categoryIds.has(categoryId)) {
        errors.categoryId = "Указана неизвестная категория.";
      }
    }
  }

  const valid = Object.keys(errors).length === 0;
  const value = valid ? { title, priority, categoryId } : null;

  return { valid, value, errors };
}