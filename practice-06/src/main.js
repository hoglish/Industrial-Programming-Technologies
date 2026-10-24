import { createApiClient, ApiError } from "./api-client.js";
import { createAppController } from "./app-controller.js";
import { createDomView } from "./dom-app.js";
import { createTaskApi } from "./task-api.js";
import { getVariantFilters, variantNumber } from "./variant.js";

function readApiUrl(params) {
  const value = params.get("api") ?? "http://127.0.0.1:5505/api";
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new TypeError("Неверный протокол API.");
  return url.href.replace(/\/$/, "");
}

// Синхронное создание задачи через XMLHttpRequest.
// Возвращает подтверждённый сервером объект (ответ 201).
// Применяется только для операции создания — остальное идёт через fetch.
function makeSyncCreate(baseUrl) {
  return function syncCreate(draft) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseUrl}/tasks`, false); // false = синхронный режим
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    try {
      xhr.send(JSON.stringify(draft));
    } catch (error) {
      throw new ApiError("Сетевая ошибка при создании задачи.", {
        kind: "network",
        cause: error,
      });
    }
    let payload = null;
    try {
      payload = JSON.parse(xhr.responseText);
    } catch {
      throw new ApiError("Ответ сервера не является корректным JSON.", {
        kind: "invalid-response",
        status: xhr.status,
      });
    }
    if (xhr.status !== 201) {
      const code = payload?.error?.code ?? null;
      const details = payload?.error?.details ?? null;
      const message = payload?.error?.message || `HTTP ${xhr.status}`;
      throw new ApiError(message, {
        kind: "http",
        status: xhr.status,
        code,
        details,
      });
    }
    if (!payload || !payload.data || typeof payload.data !== "object") {
      throw new ApiError("Ответ создания задачи не соответствует схеме.", {
        kind: "invalid-response",
        status: xhr.status,
      });
    }
    return payload.data;
  };
}

const view = createDomView();

try {
  const params = new URLSearchParams(window.location.search);
  const baseUrl = readApiUrl(params);
  const initialFilters = params.get("dataset") === "variant"
    ? getVariantFilters(variantNumber)
    : {};
  view.setApiUrl(baseUrl);
  view.setFilters(initialFilters);

  const client = createApiClient({ baseUrl, timeoutMs: 3000 });
  const api = createTaskApi(client);
  const syncCreate = makeSyncCreate(baseUrl);
  const controller = createAppController({ api, view, syncCreate });

  view.connect({
    submitSync: (draft) => controller.submitSync(draft),
    submit: (draft) => controller.submit(draft),
    filters: (filters) => controller.applyFilters(filters),
    refresh: () => controller.refresh(),
    cancelEdit: () => controller.cancelEdit(),
    resetData: () => controller.resetData(),
    taskAction(action, id) {
      if (action === "toggle") controller.toggleTask(id);
      if (action === "edit") controller.beginEdit(id);
      if (action === "delete") controller.deleteTask(id);
    },
  });

  const ready = controller.start(initialFilters);
  window.practice06 = { controller, ready };
} catch (error) {
  console.error(error);
  view.setListState("error", "Приложение не запустилось. Проверьте Console и выполните задания в src.");
}