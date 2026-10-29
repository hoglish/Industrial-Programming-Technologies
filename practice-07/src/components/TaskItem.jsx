// src/components/TaskItem.jsx
const PRIORITY_LABELS = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
  return (
    <li className="task-card" data-task-id={task.id}>
      <div className="task-content">
        <h3 className="task-title">{task.title}</h3>
        <div className="task-meta">
          <span className="task-status">
            {task.completed ? 'Выполнена' : 'В работе'}
          </span>
          <span className="task-priority">
            {PRIORITY_LABELS[task.priority] ?? task.priority}
          </span>
          <span className="task-category">{categoryName}</span>
        </div>
      </div>
      <div className="actions">
        <button type="button" data-action="toggle" onClick={() => onToggle(task.id)}>
          {task.completed ? 'Вернуть в работу' : 'Завершить'}
        </button>
        <button type="button" data-action="edit" onClick={() => onEdit(task.id)}>
          Изменить
        </button>
        <button type="button" data-action="delete" onClick={() => onDelete(task.id)}>
          Удалить
        </button>
      </div>
    </li>
  );
}