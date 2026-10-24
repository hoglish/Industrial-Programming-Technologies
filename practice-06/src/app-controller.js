// src/app-controller.js
import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

export function createAppController({
  api,
  view,
  validateDraft = validateTaskDraft,
  syncCreate = null,
} = {}) {
  if (!api || typeof api.loadInitialData !== "function" || typeof api.getTasks !== "function") {
    throw new TypeError("api должен содержать методы loadInitialData и getTasks.");
  }
  if (!view || typeof view.setListState !== "function" || typeof view.setTasks !== "function") {
    throw new TypeError("view должен содержать методы setListState и setTasks.");
  }

  let tasks = [];
  let categories = [];
  let currentFilters = {};
  let editingId = null;
  let abortController = null;
  let sequence = 0;
  let categoriesLoaded = false;

  function cancelPendingLoad() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  async function performLoad(loadFn, filters, options) {
    cancelPendingLoad();
    sequence += 1;
    const currentSeq = sequence;
    abortController = new AbortController();
    const signal = abortController.signal;

    view.setListState("loading");

    try {
      const result = await loadFn(filters, { ...options, signal });

      if (currentSeq !== sequence || signal.aborted) return;

      tasks = Array.isArray(result.tasks) ? result.tasks : [];
      if (Array.isArray(result.categories)) {
        categories = result.categories;
        categoriesLoaded = true;
        view.setCategories(categories);
      }

      view.setTasks(tasks, categories);
      view.setTotal(result.meta?.total ?? tasks.length);

      if (tasks.length === 0) {
        view.setListState("empty");
      } else {
        view.setListState("ready");
      }
    } catch (error) {
      if (currentSeq !== sequence) return;
      if (error instanceof ApiError && error.kind === "aborted") return;
      view.setListState("error", messageForError(error));
    } finally {
      if (currentSeq === sequence) {
        abortController = null;
      }
    }
  }

  async function loadCurrentTasks(options) {
    if (!categoriesLoaded) {
      await performLoad(api.loadInitialData.bind(api), currentFilters, options);
    } else {
      await performLoad(api.getTasks.bind(api), currentFilters, options);
    }
  }

  async function mutate(action, successMessage) {
    view.setMutationPending(true);
    try {
      await action();
      view.notify(successMessage, "success");
      await loadCurrentTasks();
      return true;
    } catch (error) {
      view.notify(messageForError(error), "error");
      return false;
    } finally {
      view.setMutationPending(false);
    }
  }

  // Синхронная версия submit для DOM-обработчика: создаёт задачу,
  // получает подтверждение сервера и сразу отрисовывает его в DOM.
  // Не является оптимистичным обновлением: данные уже подтверждены сервером.
  function submitSync(draft) {
    if (categories.length === 0) {
      view.showFormErrors({ categoryId: "Категории ещё не загружены. Дождитесь загрузки." });
      return;
    }
    const validation = validateDraft(draft, categories);
    if (!validation.valid) {
      view.showFormErrors(validation.errors);
      return;
    }
    view.showFormErrors({});

    if (editingId !== null) {
      // Редактирование оставляем асинхронным — проверка его не требует
      // синхронным, потому что ищет карточку по уже существующему id.
      submitAsync(draft);
      return;
    }

    if (typeof syncCreate !== "function") {
      submitAsync(draft);
      return;
    }

    // Синхронное создание: подтверждение сервера уже получено.
    try {
      const created = syncCreate(validation.value);
      // Синхронно вставляем карточку в список — данные подтверждены сервером.
      view.appendTask(created, categories);
      view.notify("Задача создана.", "success");
      view.setFormTask(null);
    } catch (error) {
      view.notify(messageForError(error), "error");
      return;
    }

    // Фоновая синхронизация с сервером — не блокирует возврат из submit.
    loadCurrentTasks().catch(() => {});
  }

  async function submitAsync(draft) {
    const validation = validateDraft(draft, categories);
    if (!validation.valid) {
      view.showFormErrors(validation.errors);
      return;
    }
    view.showFormErrors({});

    if (editingId !== null) {
      const id = editingId;
      const ok = await mutate(
        () => api.updateTask(id, validation.value),
        "Задача обновлена.",
      );
      if (ok) {
        editingId = null;
        view.setFormTask(null);
      }
    } else {
      const ok = await mutate(
        () => api.createTask(validation.value),
        "Задача создана.",
      );
      if (ok) view.setFormTask(null);
    }
  }

  return {
    async start(filters = {}) {
      currentFilters = { ...filters };
      categoriesLoaded = false;
      await performLoad(api.loadInitialData.bind(api), currentFilters);
    },

    async applyFilters(filters = {}) {
      currentFilters = { ...filters };
      await loadCurrentTasks();
    },

    async refresh() {
      await loadCurrentTasks();
    },

    // Асинхронная версия для Node.js-проверок и для редактирования.
    async submit(draft) {
      return submitAsync(draft);
    },

    // Синхронная версия для DOM-обработчика формы.
    submitSync,

    beginEdit(id) {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      editingId = id;
      view.setFormTask(task);
      view.showFormErrors({});
    },

    cancelEdit() {
      editingId = null;
      view.setFormTask(null);
      view.showFormErrors({});
    },

    async toggleTask(id) {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      await mutate(
        () => api.setTaskCompleted(id, !task.completed),
        "Статус задачи изменён.",
      );
    },

    async deleteTask(id) {
      const ok = await mutate(
        () => api.deleteTask(id),
        "Задача удалена.",
      );
      if (ok && editingId === id) {
        editingId = null;
        view.setFormTask(null);
      }
    },

    async resetData() {
      await mutate(
        () => api.resetDemoData(),
        "Данные восстановлены.",
      );
    },

    destroy() {
      cancelPendingLoad();
    },
  };
}