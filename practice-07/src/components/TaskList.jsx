// src/components/TaskList.jsx
import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete }) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  return (
    <section aria-label="Список задач">
      <h2>Задачи</h2>
      <p>Найдено: {tasks.length}</p>
      {tasks.length === 0 ? (
        <p role="status">По выбранным условиям задач нет.</p>
      ) : (
        <ul className="task-list">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              categoryName={categoryMap.get(task.categoryId) ?? 'Без категории'}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}