// src/task-api.js
import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

function normalizeFilters(filters) {
  if (filters === undefined) return {};
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("Фильтры должны быть объектом.");
  }

  const normalized = {};
  for (const key of Object.keys(filters)) {
    if (!ALLOWED_FILTERS.has(key)) {
      throw new TypeError(`Неизвестный фильтр: ${key}.`);
    }
  }

  if ("completed" in filters) {
    const v = filters.completed;
    if (v !== null && v !== undefined) {
      if (typeof v !== "boolean") {
        throw new TypeError("completed должен быть boolean.");
      }
      normalized.completed = v;
    }
  }

  if ("priority" in filters) {
    const v = filters.priority;
    if (v !== null && v !== undefined) {
      if (typeof v !== "string") {
        throw new TypeError("priority должен быть строкой.");
      }
      if (!ALLOWED_PRIORITIES.has(v)) {
        throw new TypeError("priority должен быть low, medium или high.");
      }
      normalized.priority = v;
    }
  }

  if ("categoryId" in filters) {
    const v = filters.categoryId;
    if (v !== null && v !== undefined) {
      if (typeof v !== "number") {
        throw new TypeError("categoryId должен быть числом.");
      }
      if (!isPositiveSafeInteger(v)) {
        throw new TypeError("categoryId должен быть положительным целым числом.");
      }
      normalized.categoryId = v;
    }
  }

  if ("q" in filters) {
    const v = filters.q;
    if (v !== null && v !== undefined) {
      if (typeof v !== "string") {
        throw new TypeError("q должен быть строкой.");
      }
      const trimmed = v.trim();
      if (trimmed.length > 100) {
        throw new TypeError("q не должен быть длиннее 100 символов.");
      }
      if (trimmed.length > 0) normalized.q = trimmed;
    }
  }

  return normalized;
}

function assertUniqueIds(items, entityName) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw invalidResponse(
        `Повторяющийся id ${item.id} в коллекции ${entityName}.`,
      );
    }
    seen.add(item.id);
  }
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("client должен содержать метод requestJson.");
  }

  async function getTasks(filters, options) {
    const normalized = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query: normalized, ...options });

    if (!payload || typeof payload !== "object") {
      throw invalidResponse("Ответ /tasks не является объектом.");
    }
    const { data, meta } = payload;
    if (!Array.isArray(data)) {
      throw invalidResponse("Поле data в ответе /tasks не является массивом.");
    }
    for (const task of data) {
      if (!isTask(task)) {
        throw invalidResponse(
          `Задача с id ${task?.id ?? "unknown"} не соответствует схеме.`,
        );
      }
    }
    assertUniqueIds(data, "tasks");
    if (meta && typeof meta.total === "number" && meta.total !== data.length) {
      throw invalidResponse(
        `meta.total (${meta.total}) не совпадает с длиной массива (${data.length}).`,
      );
    }
    return {
      tasks: data,
      meta: meta ?? { total: data.length, filters: normalized },
    };
  }

  async function getTaskById(id, options) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом.");
    }
    const payload = await client.requestJson(`/tasks/${id}`, options);
    if (!payload || typeof payload !== "object") {
      throw invalidResponse("Ответ /tasks/:id не является объектом.");
    }
    const { data } = payload;
    if (!isTask(data)) {
      throw invalidResponse(`Задача с id ${id} не соответствует схеме.`);
    }
    return data;
  }

  async function getCategories(options) {
    const payload = await client.requestJson("/categories", options);
    if (!payload || typeof payload !== "object") {
      throw invalidResponse("Ответ /categories не является объектом.");
    }
    const { data, meta } = payload;
    if (!Array.isArray(data)) {
      throw invalidResponse("Поле data в ответе /categories не является массивом.");
    }
    for (const category of data) {
      if (!isCategory(category)) {
        throw invalidResponse(
          `Категория с id ${category?.id ?? "unknown"} не соответствует схеме.`,
        );
      }
    }
    assertUniqueIds(data, "categories");
    if (meta && typeof meta.total === "number" && meta.total !== data.length) {
      throw invalidResponse(
        `meta.total (${meta.total}) не совпадает с длиной массива (${data.length}).`,
      );
    }
    return data;
  }

  async function loadInitialData(filters, options) {
    const [tasksResult, categories] = await Promise.all([
      getTasks(filters, options),
      getCategories(options),
    ]);
    return {
      tasks: tasksResult.tasks,
      categories,
      meta: tasksResult.meta,
    };
  }

  async function createTask(draft, options) {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
      throw new TypeError("Черновик задачи должен быть объектом.");
    }
    const payload = await client.requestJson("/tasks", {
      method: "POST",
      body: draft,
      ...options,
    });
    if (!payload || typeof payload !== "object" || !isTask(payload.data)) {
      throw invalidResponse("Ответ создания задачи не соответствует схеме.");
    }
    return payload.data;
  }

  async function updateTask(id, changes, options) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом.");
    }
    if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
      throw new TypeError("Изменения должны быть объектом.");
    }
    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: changes,
      ...options,
    });
    if (!payload || typeof payload !== "object" || !isTask(payload.data)) {
      throw invalidResponse("Ответ обновления задачи не соответствует схеме.");
    }
    return payload.data;
  }

  async function setTaskCompleted(id, completed, options) {
    if (typeof completed !== "boolean") {
      throw new TypeError("completed должен быть boolean.");
    }
    return updateTask(id, { completed }, options);
  }

  async function deleteTask(id, options) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом.");
    }
    const result = await client.requestJson(`/tasks/${id}`, {
      method: "DELETE",
      ...options,
    });
    if (result !== null) {
      throw invalidResponse("DELETE должен возвращать null (ответ 204).");
    }
    return null;
  }

  async function resetDemoData(options) {
    const payload = await client.requestJson("/debug/reset", {
      method: "POST",
      ...options,
    });
    if (
      !payload ||
      typeof payload !== "object" ||
      !payload.data ||
      typeof payload.data.reset !== "boolean" ||
      typeof payload.data.total !== "number"
    ) {
      throw invalidResponse("Ответ reset не соответствует схеме.");
    }
    return payload.data;
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData,
  };
}