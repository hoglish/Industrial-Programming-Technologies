import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";
const priorityStyles = document.createElement("style");
priorityStyles.textContent = `
  #priority-filters {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed #d7dfe7;
  }
  .filter-label {
    font-size: .9rem;
    color: #52606e;
    font-weight: 600;
    margin-right: 4px;
  }
  .task-card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 18px;
  }
  .task-title {
    flex: 1 1 100%;
    margin: 0 0 7px;
  }
  .task-actions {
    margin-left: auto;
    margin-top: 0;
  }
  @media (max-width: 640px) {
    .task-actions { margin-left: 0; width: 100%; }
  }
`;
document.head.appendChild(priorityStyles);

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
};

// Готовая служебная часть: ?dataset=variant включает данные своего варианта.
// Наборы не смешиваются, редактировать код для переключения не требуется.
const isVariant = new URLSearchParams(window.location.search).get("dataset") === "variant";
const initialTasks = isVariant ? variantTasks : demoTasks;
let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";
let currentPriority = "all"

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

function renderApp() {
  // TODO: отобрать видимые задачи; обновить список, общую сводку и пустое состояние.
  // TODO: для кнопок фильтра обновить is-active и aria-pressed.
  // Не изменять currentTasks и не добавлять обработчики событий в этой функции.
  
  
  
  
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter, currentPriority);
  renderTaskList(elements.list,visibleTasks);
  renderSummary(elements.summary, currentTasks, visibleTasks.length);
  renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);

  updateFilterButtons(elements.filters, currentFilter, 'data-filter');
  
  // Обновление кнопок приоритета (новое)
  updateFilterButtons(document.querySelector('#priority-filters'), currentPriority, 'data-priority');

// Вспомогательная функция для обновления классов кнопок (чтобы не дублировать код)


}


  //throw new Error("Не реализовано: renderApp");


function updateFilterButtons(container, activeValue, dataAttr) {
  if (!container) return;
  const buttons = container.querySelectorAll(`button[${dataAttr}]`);
  buttons.forEach(button => {
    const isActive = button.getAttribute(dataAttr) === activeValue;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}


function handleTaskListClick(event) {
  // TODO: найти кнопку через closest(), проверить её принадлежность списку.
  // TODO: распознать toggle/delete; прочитать и проверить числовой id карточки.
  // TODO: вызвать функцию ПР2, разобрать ok/error, сохранить успешный результат.
  // TODO: renderApp(), затем restoreTaskFocus(id, action).
  if (!event.target || typeof event.target.closest !== 'function') return;
  const button = event.target.closest('button[data-action]');

  if (!button) return;
  const action = button.dataset.action;
  if (action !== 'toggle' && action !=='delete') return;
  const taskCard = button.closest('li[data-task-id]');
  if (!taskCard) return;
  const id = Number(taskCard.dataset.taskId);
  if (isNaN(id) || id<=0 ){
    console.error('Некоректный идентификатор задачи');
    return;
  }

  let result;

  if(action === 'toggle'){
    const foundItem = findTaskById(currentTasks,id);
    if(!foundItem){
      console.error(`Задача с id ${id} не найдена`)
      return;
    }
    const nextCompletedStatus = !foundItem.completed; // возможна тут ошибка
    result = setTaskCompleted(currentTasks,id,nextCompletedStatus);

  } else if(action === 'delete'){
    result = removeTask(currentTasks,id);


  }
  if (result && result.ok) {
    currentTasks = result.tasks;
    elements.message.textContent = "";
    renderApp();
    if (typeof restoreTaskFocus === 'function') {
      restoreTaskFocus(id, action);
    }
  } else if (result && !result.ok) {
    elements.message.textContent = result.error;
  }
  //throw new Error("Не реализовано: handleTaskListClick");
}

function handlePriorityClick(event) {
  if (!event.target || typeof event.target.closest !== "function") return;
  const button = event.target.closest("button[data-priority]");
  if (!button) return;
  const selectedPriority = button.dataset.priority;
  if (!["all", "low", "medium", "high"].includes(selectedPriority)) return;
  currentPriority = selectedPriority;
  renderApp();
}

// Не забудьте добавить слушатель при инициализации (в конце файла main.js):
document.querySelector('#priority-filters').addEventListener('click', handlePriorityClick);

function handleFilterClick(event) {
  // TODO: найти кнопку фильтра, проверить all/pending/completed.
  // TODO: изменить только currentFilter, очистить сообщение и вызвать renderApp().
  if (!event.target || typeof event.target.closest !== "function") return;
  const button = event.target.closest("button[data-filter]")
  if(!button)return;
  const selectedFilter = button.dataset.filter;
  if(!selectedFilter)return;
  currentFilter = selectedFilter;
  renderApp();
  
  //throw new Error("Не реализовано: handleFilterClick");
}

// Готовая вспомогательная функция. Сохраняет понятную позицию клавиатурного фокуса
// после замены карточек. Если карточки больше нет, фокус получает активный фильтр.
function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

// Подписки выполняются один раз. Эти контейнеры не заменяются при перерисовке.
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);

// До реализации renderApp ожидается сообщение о заглушке.
// try/catch здесь — готовая диагностика старта, а не замена проверки result.ok.
try {
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}

// Запуск начальной отрисовки приложения при загрузке страницы



