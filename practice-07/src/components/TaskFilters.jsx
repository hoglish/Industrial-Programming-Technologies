// src/components/TaskFilters.jsx
export default function TaskFilters({ filters, categories, onChange, onReset }) {
  function handleChange(event) {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value });
  }

  return (
    <section aria-label="Фильтры">
      <h2>Фильтры</h2>
      <div className="filter-grid">
        <label>
          Поиск
          <input
            type="search"
            name="q"
            value={filters.q}
            onChange={handleChange}
            maxLength={100}
            placeholder="Фрагмент названия"
          />
        </label>

        <label>
          Статус
          <select name="completed" value={filters.completed} onChange={handleChange}>
            <option value="">Все</option>
            <option value="false">В работе</option>
            <option value="true">Выполненные</option>
          </select>
        </label>

        <label>
          Приоритет
          <select name="priority" value={filters.priority} onChange={handleChange}>
            <option value="">Все</option>
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </label>

        <label>
          Категория
          <select name="categoryId" value={filters.categoryId} onChange={handleChange}>
            <option value="">Все</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
          </select>
        </label>
      </div>
      <button type="button" onClick={onReset}>Сбросить фильтры</button>
    </section>
  );
}