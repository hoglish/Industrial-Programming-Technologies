// src/components/TaskStats.jsx
export default function TaskStats({ stats }) {
  return (
    <section aria-label="Статистика">
      <h2>Статистика</h2>
      <p>Всего: {stats.total}</p>
      <p>Выполнено: {stats.completed}</p>
      <p>В работе: {stats.active}</p>
    </section>
  );
}