// Новый модуль ПР3. Вход: корректный массив задач и фильтр all/pending/completed.
// Результат: новый массив, исходный порядок и объекты сохраняются.


export function getVisibleTasks(tasks, filter = "all",priority = "all") {
  // TODO: all — копия массива, pending — невыполненные, completed — выполненные.
if (!Array.isArray(tasks)) return [];

  let result = tasks;
  
  switch (filter) {
    case 'pending':
      result = tasks.filter(item => item && item.completed === false);
      break;
    case 'completed':
      result = tasks.filter(item => item && item.completed === true);
      break;
    case 'all':
    default:
      result = [...tasks]; 
      break;
  }

  if (priority !== 'all') {
    result = result.filter(item => item && item.priority === priority);
  }

  return result;
}
