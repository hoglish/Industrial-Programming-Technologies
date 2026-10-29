// src/components/TaskForm.jsx
import { useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';

export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => {
    if (initialTask) {
      return {
        title: initialTask.title,
        priority: initialTask.priority,
        categoryId: String(initialTask.categoryId),
      };
    }
    return {
      title: '',
      priority: 'medium',
      categoryId: categories.length > 0 ? String(categories[0].id) : '',
    };
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setDraft(previous => ({ ...previous, [name]: value }));
    // Очищаем ошибку поля при изменении
    if (errors[name]) {
      setErrors(previous => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validation = validateTaskDraft(draft, categories);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      setMessage('');
      return;
    }

    setErrors({});
    const success = onSave(validation.value);
    
    if (success) {
      // Очищаем форму только при успешном сохранении
      setDraft({
        title: '',
        priority: 'medium',
        categoryId: categories.length > 0 ? String(categories[0].id) : '',
      });
      setMessage('Задача сохранена.');
    } else {
      setMessage('Не удалось сохранить задачу.');
    }
  }

  const isEditing = initialTask !== null;

  return (
    <section aria-label="Форма задачи">
      <h2>{isEditing ? 'Редактирование задачи' : 'Добавление задачи'}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Название
          <input
            type="text"
            name="title"
            value={draft.title}
            onChange={handleChange}
            aria-invalid={errors.title ? 'true' : undefined}
            aria-describedby="title-error"
          />
          {errors.title && <p id="title-error" role="alert">{errors.title}</p>}
        </label>

        <label>
          Приоритет
          <select
            name="priority"
            value={draft.priority}
            onChange={handleChange}
            aria-invalid={errors.priority ? 'true' : undefined}
            aria-describedby="priority-error"
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
          {errors.priority && <p id="priority-error" role="alert">{errors.priority}</p>}
        </label>

        <label>
          Категория
          <select
            name="categoryId"
            value={draft.categoryId}
            onChange={handleChange}
            aria-invalid={errors.categoryId ? 'true' : undefined}
            aria-describedby="category-error"
          >
            <option value="">Выберите категорию</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <p id="category-error" role="alert">{errors.categoryId}</p>}
        </label>

        <div className="actions">
          <button type="submit">{isEditing ? 'Сохранить изменения' : 'Добавить задачу'}</button>
          {isEditing && (
            <button type="button" onClick={onCancel}>Отменить редактирование</button>
          )}
        </div>

        {message && <p role="status">{message}</p>}
      </form>
    </section>
  );
}