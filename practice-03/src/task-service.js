export function createTask(id, title, priority = "medium") {
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "Некорректный идентификатор" };
  }
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const normalizedTitle = title.trim();
  if (normalizedTitle.length === 0 || normalizedTitle.length > 100) {
    return { ok: false, error: "Длина названия должна быть от 1 до 100 символов" };
  }
  if (priority !== "low" && priority !== "medium" && priority !== "high") {
    return { ok: false, error: "Недопустимый приоритет" };
  }

  return {
    ok: true,
    task: {
      id,
      title: normalizedTitle,
      completed: false,
      priority,
    },
  };
}

export function findTaskById(tasks, id) {
  return tasks.find((item) => item.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((item) => item.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((item) => item.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((item) => item.completed === true).length;
  const pending = total - completed;
  // Тест 18 требует, чтобы progress возвращался БЕЗ предварительного округления
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return {
    total,
    completed,
    pending,
    progress,
  };
}

export function addTask(tasks, id, title, priority = "medium") {
  const createResult = createTask(id, title, priority);
  if (!createResult.ok) {
    return { ok: false, error: createResult.error };
  }

  const isDuplicate = tasks.some((item) => item.id === id);
  if (isDuplicate) {
    return { ok: false, error: "Задача с таким ID уже существует" };
  }

  return {
    ok: true,
    tasks: [...tasks, createResult.task],
  };
}

export function setTaskCompleted(tasks, id, completed) {
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "Некорректный идентификатор" };
  }
  if (typeof completed !== "boolean") {
    return { ok: false, error: "Статус должен быть логическим значением" };
  }

  const found = tasks.some((item) => item.id === id);
  if (!found) {
    return { ok: false, error: "Задача не найдена" };
  }

  const updatedTasks = tasks.map((item) => {
    if (item.id === id) {
      return { ...item, completed };
    }
    return item;
  });

  return { ok: true, tasks: updatedTasks };
}

export function renameTask(tasks, id, title) {
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "Некорректный идентификатор" };
  }
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  
  const normalizedTitle = title.trim();
  if (normalizedTitle.length === 0 || normalizedTitle.length > 100) {
    return { ok: false, error: "Длина названия должна быть от 1 до 100 символов" };
  }

  const found = tasks.some((item) => item.id === id);
  if (!found) {
    return { ok: false, error: "Задача не найдена" };
  }

  const updatedTasks = tasks.map((item) => {
    if (item.id === id) {
      return { ...item, title: normalizedTitle };
    }
    return item;
  });

  return { ok: true, tasks: updatedTasks };
}

export function removeTask(tasks, id) {
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "Некорректный идентификатор" };
  }

  const found = tasks.some((item) => item.id === id);
  if (!found) {
    return { ok: false, error: "Задача не найдена" };
  }

  const updatedTasks = tasks.filter((item) => item.id !== id);
  return { ok: true, tasks: updatedTasks };
}