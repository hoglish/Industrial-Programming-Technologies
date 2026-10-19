const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let validId = null;

  // --- Проверка ID ---
  if (editingId === null) {
    // Режим СОЗДАНИЯ
    const numId = Number(draft.id);
    if (!Number.isSafeInteger(numId) || numId <= 0) {
      errors.id = "ID должен быть положительным целым числом.";
    } else if (tasks.some((task) => task.id === numId)) {
      errors.id = "Задача с таким ID уже существует.";
    } else {
      validId = numId;
    }
  } else {
    // Режим РЕДАКТИРОВАНИЯ
    if (!Number.isSafeInteger(editingId) || editingId <= 0) {
      errors.id = "Некорректный идентификатор редактируемой задачи.";
    } else if (!tasks.some((task) => task.id === editingId)) {
      errors.id = "Редактируемая задача не найдена.";
    } else {
      validId = editingId;
    }
  }

  // --- Проверка Названия ---
  const normalizedTitle = typeof draft.title === "string" ? draft.title.trim() : "";
  if (normalizedTitle.length === 0 || normalizedTitle.length > 100) {
    errors.title = "Название должно быть от 1 до 100 символов.";
  }

  // --- Проверка Приоритета ---
  if (!ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = "Недопустимый приоритет.";
  }

  // --- Формирование результата ---
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { 
    ok: true, 
    value: { id: validId, title: normalizedTitle, priority: draft.priority } 
  };
}
