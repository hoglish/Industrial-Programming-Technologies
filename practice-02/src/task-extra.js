export function searchTasks(tasks, query) {
  if (typeof query !== "string") {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [...tasks];
  }

  return tasks.filter((task) => {
    if (!task.title || typeof task.title !== "string") {
      return false;
    }
    return task.title.toLowerCase().includes(normalizedQuery);
  });
}