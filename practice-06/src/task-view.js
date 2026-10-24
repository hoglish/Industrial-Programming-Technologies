// src/task-view.js
const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

export function createTaskElement(task, category) {
  const li = document.createElement("li");
  li.className = "task-card";
  if (task.completed) li.classList.add("is-completed");
  li.dataset.taskId = String(task.id);

  const content = document.createElement("div");
  content.className = "task-content";

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;

  const categoryEl = document.createElement("span");
  categoryEl.className = "task-category";
  categoryEl.textContent = category ? category.name : "Без категории";

  meta.append(status, priority, categoryEl);
  content.append(title, meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.dataset.action = "toggle";
  toggleBtn.className = "button-secondary";
  const toggleLabel = document.createElement("span");
  toggleLabel.className = "action-label";
  toggleLabel.textContent = task.completed ? "Вернуть в работу" : "Завершить";
  toggleBtn.append(toggleLabel);

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.dataset.action = "edit";
  editBtn.className = "button-secondary";
  const editLabel = document.createElement("span");
  editLabel.className = "action-label";
  editLabel.textContent = "Изменить";
  editBtn.append(editLabel);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.dataset.action = "delete";
  deleteBtn.className = "button-danger";
  const deleteLabel = document.createElement("span");
  deleteLabel.className = "action-label";
  deleteLabel.textContent = "Удалить";
  deleteBtn.append(deleteLabel);

  actions.append(toggleBtn, editBtn, deleteBtn);
  li.append(content, actions);

  return li;
}

export function renderTaskList(list, tasks, categories) {
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]));
  const fragment = document.createDocumentFragment();
  for (const task of tasks) {
    const category = categoryMap.get(task.categoryId);
    fragment.append(createTaskElement(task, category));
  }
  list.replaceChildren(fragment);
}