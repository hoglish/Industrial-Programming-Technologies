import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
  addTask,
  findTaskById,
  removeTask,
  setTaskCompleted,
  updateTask,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderEmptyState, renderSummary, renderTaskList } from "./task-view.js";
import { validateTaskDraft } from "./form-validation.js";
import { loadTasks, removeSavedTasks, saveTasks, saveDraft, loadDraft, removeDraft } from "./task-storage.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
  storageStatus: document.querySelector("#storage-status"),
  form: document.querySelector("#task-form"),
  formHeading: document.querySelector("#form-heading"),
  formMode: document.querySelector("#form-mode"),
  formMessage: document.querySelector("#form-message"),
  idInput: document.querySelector("#task-id"),
  titleInput: document.querySelector("#task-title"),
  priorityInput: document.querySelector("#task-priority"),
  submitButton: document.querySelector("#form-submit"),
  cancelButton: document.querySelector("#cancel-edit"),
  resetButton: document.querySelector("#reset-data"),
};

const params = new URLSearchParams(window.location.search);
const isVariant = params.get("dataset") === "variant";
const isCheckRun = params.get("mode") === "check";
const initialTasks = isVariant ? variantTasks : demoTasks;
const datasetName = isVariant ? "variant" : "demo";
const storageKey = isCheckRun
  ? `tip-js-practice-04:checks:${datasetName}`
  : `tip-js-practice-04:${datasetName}`;

// Готовая граница запуска: даже незавершённый или ошибочный модуль хранилища
// не должен оставлять страницу без диагностического сообщения.
let loaded;
try {
  loaded = loadTasks(window.localStorage, storageKey, initialTasks);
} catch (error) {
  loaded = {
    ok: false,
    source: "fallback",
    tasks: initialTasks.map((task) => ({ ...task })),
    error: `Хранилище не инициализировано: ${error.message}`,
  };
  console.error(error);
}
let currentTasks = loaded.tasks;
let currentFilter = "all";
let editingId = null;

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

if (loaded.source === "storage") {
  elements.storageStatus.textContent = "Данные восстановлены из localStorage.";
} else if (loaded.ok) {
  elements.storageStatus.textContent = "Используется исходный набор; сохранённых данных пока нет.";
} else {
  elements.storageStatus.textContent = loaded.error;
  elements.storageStatus.classList.add("is-warning");
}

const draftKey = isCheckRun
  ? `tip-js-practice-04:checks:${datasetName}:draft`
  : `tip-js-practice-04:${datasetName}:draft`;

function renderApp() {
  // TODO: перенести согласованную отрисовку ПР3.
  // Отобрать задачи, обновить список, сводку, пустое состояние и кнопки фильтра.
  // Не читать и не записывать localStorage внутри функции отрисовки.
    const visibleTasks = getVisibleTasks(currentTasks, currentFilter);
  
  // 2. Отрисовываем список задач
  renderTaskList(elements.list, visibleTasks);
  
  // 3. Отрисовываем сводку (всего, выполнено, осталось, прогресс, показано)
  renderSummary(elements.summary, currentTasks, visibleTasks.length);
  
  // 4. Показываем/скрываем сообщение о пустом списке
  renderEmptyState(elements.empty, visibleTasks.length);
  
  // 5. Обновляем состояние кнопок фильтра (активная кнопка)
  const filterButtons = elements.filters.querySelectorAll('button[data-filter]');
  filterButtons.forEach(btn => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
  //throw new Error("Не реализовано: renderApp");
}

function clearFieldError(name) {
  const input = elements.form.elements.namedItem(name);
  const message = elements.form.querySelector(`[data-error-for="${name}"]`);
  if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
    input.setCustomValidity("");
    input.removeAttribute("aria-invalid");
  }
  if (message) message.textContent = "";
}

function clearFormErrors() {
  for (const name of ["id", "title", "priority"]) clearFieldError(name);
  elements.formMessage.textContent = "";
}

function showFormErrors(errors) {
  clearFormErrors();
  for (const [name, text] of Object.entries(errors)) {
    const input = elements.form.elements.namedItem(name);
    const message = elements.form.querySelector(`[data-error-for="${name}"]`);
    if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
      input.setCustomValidity(text);
      input.setAttribute("aria-invalid", "true");
    }
    if (message) message.textContent = text;
  }
  elements.form.reportValidity();
}

function setFormMode(id = null) {
  // TODO: для null очистить форму и включить режим создания.
  // Для существующего id заполнить поля, заблокировать изменение id
  // и включить режим редактирования. Отсутствующий id обработать как отказ.
  if (id === null){
    editingId = null;
    clearFormErrors();
    elements.form.reset();

    elements.idInput.disabled = false;
    elements.formHeading.textContent = "Добавление задачи";
    elements.submitButton.textContent = "Добавить задачу";
    elements.cancelButton.hidden = true;
    elements.idInput.focus();
  } else {
    const task = findTaskById(currentTasks,id);
    if(!task){
      elements.message.textContent = `Задача с ID ${id} не найдена.`; 
      return;   }
    editingId = id;
    clearFormErrors();


    elements.idInput.value = task.id;
    elements.titleInput.value = task.title;
    elements.priorityInput.value = task.priority;

    elements.idInput.disabled = true;
    elements.formHeading.textContent = "Редактирование задачи";
    elements.submitButton.textContent = "Сохранить изменения";
    elements.cancelButton.hidden = false;

    elements.titleInput.focus();
  }

  //throw new Error("Не реализовано: setFormMode");
}

function persistCurrentTasks(successMessage) {
  const saved = saveTasks(window.localStorage, storageKey, currentTasks);
  elements.storageStatus.classList.toggle("is-warning", !saved.ok);
  elements.storageStatus.textContent = saved.ok
    ? "Изменения сохранены в localStorage."
    : saved.error;
  elements.message.textContent = saved.ok ? successMessage : `${successMessage} ${saved.error}`;
  renderApp();
  return saved;
}

// Готовая вспомогательная функция из логики ПР3. После полной перерисовки
// возвращает фокус на действие той же задачи либо на активный фильтр.
function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

function handleFormSubmit(event) {
  event.preventDefault();
  // TODO: собрать draft из трёх полей и вызвать validateTaskDraft.
  // При отказе показать ошибки, не менять данные и не обращаться к storage.
  // В режиме создания вызвать addTask, в режиме редактирования — updateTask.
  // При успехе сохранить новый массив, выйти из режима редактирования,
  // записать localStorage и обновить интерфейс.
  const formData = new FormData(elements.form);
  const draft = {
    id: formData.get("id"),
    title: formData.get("title"),
    priority: formData.get("priority"),
  };

  const validation = validateTaskDraft(draft, currentTasks, editingId);

  if (!validation.ok) {
    showFormErrors(validation.errors);
    return;
  }

  let result;
  if (editingId === null) {
    result = addTask(currentTasks, validation.value.id, validation.value.title, validation.value.priority);
  } else {
    result = updateTask(currentTasks, editingId, validation.value.title, validation.value.priority);
  }

  if (result.ok) {
    currentTasks = result.tasks;
    const successMsg = editingId === null ? "Задача добавлена." : "Задача обновлена.";
    persistCurrentTasks(successMsg);
    
    // Удаляем черновик после успешного добавления (только в режиме создания)
    if (editingId === null) {
      removeDraft(window.localStorage, draftKey);
    }
    
    setFormMode(null);
  } else {
    elements.formMessage.textContent = result.error;
  }
}

  //throw new Error("Не реализовано: handleFormSubmit");


function handleTaskListClick(event) {
  // TODO: перенести toggle/delete из ПР3 и добавить действие edit.
  // edit только переводит форму в режим редактирования и не пишет storage.
  // После успешных toggle/delete сохранить currentTasks через persistCurrentTasks,
  // затем вызвать restoreTaskFocus(id, action).
  void event;
   if (!event.target || typeof event.target.closest !== 'function') return;
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  if (action !== 'toggle' && action !== 'delete' && action !== 'edit') return;

  const taskCard = button.closest('li[data-task-id]');
  if (!taskCard) return;
  
  const id = Number(taskCard.dataset.taskId);
  if (isNaN(id) || id <= 0) {
    elements.message.textContent = "Некорректный идентификатор задачи.";
    return;
  }

  // --- ДЕЙСТВИЕ EDIT ---
  if (action === 'edit') {
    setFormMode(id); // Переход в режим редактирования, БЕЗ сохранения
    return;
  }

  // --- ДЕЙСТВИЯ TOGGLE И DELETE ---
  let result;

  if (action === 'toggle') {
    const foundItem = findTaskById(currentTasks, id);
    if (!foundItem) {
      elements.message.textContent = `Задача с id ${id} не найдена.`;
      return;
    }
    const nextCompletedStatus = !foundItem.completed;
    result = setTaskCompleted(currentTasks, id, nextCompletedStatus);
  } else if (action === 'delete') {
    result = removeTask(currentTasks, id);
  }

  if (result && result.ok) {
    currentTasks = result.tasks;
    
    // Если удалили редактируемую задачу — сбрасываем форму
    if (action === 'delete' && editingId === id) {
      setFormMode(null);
    }

    elements.message.textContent = "";
    
    // СОХРАНЕНИЕ В LOCALSTORAGE (обязательно для toggle и delete)
    const saved = saveTasks(window.localStorage, storageKey, currentTasks);
    if (!saved.ok) {
      elements.message.textContent = saved.error;
    }

    renderApp();
    
    if (typeof restoreTaskFocus === 'function') {
      restoreTaskFocus(id, action);
    }
  } else if (result && !result.ok) {
    elements.message.textContent = result.error;
  }
  //throw new Error("Не реализовано: handleTaskListClick");
}

function handleFilterClick(event) {
  // TODO: перенести реализацию ПР3. Выбор фильтра не сохраняется в localStorage.
  void event;
  if (!event.target || typeof event.target.closest !== "function") return;
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  
  const selectedFilter = button.dataset.filter;
  if (!["all", "pending", "completed"].includes(selectedFilter)) return;
  
  currentFilter = selectedFilter;
  elements.message.textContent = ""; // Очищаем сообщение
  renderApp();
  //throw new Error("Не реализовано: handleFilterClick");
}

function handleResetClick() {
  // TODO: удалить только storageKey, восстановить копию initialTasks,
  // вернуть фильтр all, выйти из редактирования и обновить приложение.
  // Ошибку removeSavedTasks показать пользователю, исключение не выпускать.
  // Удаляем только текущий storageKey
  const removed = removeSavedTasks(window.localStorage, storageKey);
  
  if (!removed.ok) {
    elements.message.textContent = removed.error;
    return;
  }

  // Восстанавливаем копию initialTasks (не сохраняем обратно!)
  currentTasks = initialTasks.map((task) => ({ ...task }));
  
  // Возвращаем фильтр all
  currentFilter = "all";
  
  // Возвращаем форму в режим создания
  setFormMode(null);
  
  elements.message.textContent = "Данные сброшены к исходному состоянию.";
  
  // Обновляем интерфейс
  renderApp();
  //throw new Error("Не реализовано: handleResetClick");
}

elements.form.addEventListener("submit", handleFormSubmit);
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);
elements.cancelButton.addEventListener("click", () => setFormMode());
elements.resetButton.addEventListener("click", handleResetClick);
elements.form.addEventListener("input", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
    clearFieldError(target.name);
    
    // Сохраняем черновик только в режиме создания
    if (editingId === null) {
      const formData = new FormData(elements.form);
      const draft = {
        id: formData.get("id"),
        title: formData.get("title"),
        priority: formData.get("priority")
      };
      saveDraft(window.localStorage, draftKey, draft);
    }
  }
});

try {
  setFormMode(); // Сначала сбрасываем форму в режим создания
  
  // ПОТОМ восстанавливаем черновик (перезаписываем поля)
  if (editingId === null) {
    const draftResult = loadDraft(window.localStorage, draftKey);
    if (draftResult.ok && draftResult.draft) {
      elements.idInput.value = draftResult.draft.id;
      elements.titleInput.value = draftResult.draft.title;
      elements.priorityInput.value = draftResult.draft.priority;
    }
  }
  
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}

