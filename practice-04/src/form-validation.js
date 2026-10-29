const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let validId = null;

  if (editingId === null) {
    const numId = Number(draft.id);
    if (!Number.isSafeInteger(numId) || numId <= 0) {
      errors.id = "ID должен быть положительным целым числом.";
    } else if (tasks.some((task) => task.id === numId)) {
      errors.id = "Задача с таким ID уже существует.";
    } else {
      validId = numId;
    }
  } else {
    if (!Number.isSafeInteger(editingId) || editingId <= 0) {
      errors.id = "Некорректный идентификатор редактируемой задачи.";
    } else if (!tasks.some((task) => task.id === editingId)) {
      errors.id = "Редактируемая задача не найдена.";
    } else {
      validId = editingId;
    }
  }

  const normalizedTitle = typeof draft.title === "string" ? draft.title.trim() : "";
  if (normalizedTitle.length === 0 || normalizedTitle.length > 100) {
    errors.title = "Название должно быть от 1 до 100 символов.";
  }

  if (!ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = "Недопустимый приоритет.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { 
    ok: true, 
    value: { id: validId, title: normalizedTitle, priority: draft.priority } 
  };
}