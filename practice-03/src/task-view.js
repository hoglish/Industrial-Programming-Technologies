import { getTaskStats } from "./task-service.js";

// Здесь создаётся DOM, но не изменяется состояние приложения.
// Контракт карточки, селекторы и тексты описаны в методичке.
const ul = document.getElementById('task-list');

export function createTaskElement(task) {
  // TODO: li.task-card[data-task-id], название, статус, приоритет, две кнопки.
  // Название — через textContent. Обработчики здесь не назначаются.
  const li = document.createElement('li');
  if (task.completed){
    li.classList.add('task-card');
     li.classList.add('is-completed');
  } else {
    li.classList.add('task-card');
  }
  li.dataset.taskId = task.id;

  const title = document.createElement('h3');
  title.classList.add('task-title');
  title.textContent = task.title;

  const status = document.createElement('span');
  status.classList.add('task-status');
  if(task.completed){
    status.textContent = 'Выполнена';
  } else {
    status.textContent = 'В работе';
  }

  const priority = document.createElement('span');
  priority.classList.add('task-priority');
  switch(task.priority){
    case "low": priority.textContent = 'Низкий'; break;
    case "medium": priority.textContent = 'Средний'; break;
    case "high": priority.textContent = 'Высокий'; break;
  }

  const statusBtn = document.createElement('button');
  statusBtn.type ='button';
  statusBtn.dataset.action = 'toggle';
  statusBtn.setAttribute('aria-pressed', task.completed ? 'true' : 'false');

  const statusLabel = document.createElement('span');
  statusLabel.classList.add('action-label');
  statusLabel.textContent = "Выполнена";

  statusBtn.append(statusLabel);

  const deleteBtn = document.createElement('button');
  deleteBtn.type ='button';
  deleteBtn.dataset.action = 'delete';

  const statusLabelDelete = document.createElement('span');
  statusLabelDelete.classList.add('action-label');
  statusLabelDelete.textContent = "Удалить";

  deleteBtn.append(statusLabelDelete);
  
  li.append(title, status, priority, statusBtn, deleteBtn);

  return li;
  //throw new Error("Не реализовано: createTaskElement");
}

export function renderTaskList(listElement, tasks) {
  // TODO: создать карточки и заменить дочерние элементы списка.
  // Сам listElement сохраняется: на нём находится делегированный обработчик.
  const taskEl = tasks.map(task => createTaskElement(task));
  listElement.replaceChildren(...taskEl);
  //throw new Error("Не реализовано: renderTaskList");
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  const stats = getTaskStats(tasks);
  const totalEl = summaryElement.querySelector('[data-stat="total"]');
  const completedEl = summaryElement.querySelector('[data-stat="completed"]');
  const pendingEl = summaryElement.querySelector('[data-stat="pending"]');
  const progressEl = summaryElement.querySelector('[data-stat="progress"]');
  const visibleEl = summaryElement.querySelector('[data-stat="visible"]');

  if (totalEl) totalEl.textContent = stats.total;
  if (completedEl) completedEl.textContent = stats.completed;
  if (pendingEl) pendingEl.textContent = stats.pending;
  if (progressEl) progressEl.textContent = `${stats.progress.toFixed(1)}%`;
  if (visibleEl) visibleEl.textContent = visibleCount;
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (!messageElement) return;
  if (total === 0) {
    messageElement.textContent = "Список задач пуст.";
    messageElement.hidden = false;
  } else if (visibleCount === 0) {
    messageElement.textContent = "Нет задач по выбранному фильтру.";
    messageElement.hidden = false;
  } else {
    messageElement.textContent = "";
    messageElement.hidden = true;
  }
}
