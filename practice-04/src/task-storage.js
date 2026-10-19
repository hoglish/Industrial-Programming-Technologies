// import { version } from "react"; 

export const STORAGE_VERSION = 1;


export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;

  const seenIds = new Set();

  for (const task of value) {
    if (typeof task !== 'object' || task === null) return false;
    if (!Number.isSafeInteger(task.id) || task.id <= 0) return false;
    
    if (typeof task.title !== 'string' || task.title.trim().length === 0 || task.title.length > 100) {
      return false;
    }
    
    if (typeof task.completed !== 'boolean') return false;
    if (!['low', 'medium', 'high'].includes(task.priority)) return false;

    if (seenIds.has(task.id)) return false;
    seenIds.add(task.id);
  }

  return true;
}


export function loadTasks(storage, key, fallbackTasks) {
  const safeFallback = structuredClone(fallbackTasks);

  try {
    const raw = storage.getItem(key);

    if (raw === null) {
      return { ok: true, source: "initial", tasks: safeFallback };
    }

    const parsed = JSON.parse(raw);

    if (parsed.version !== STORAGE_VERSION || !isValidTaskList(parsed.tasks)) {
      throw new Error("Несоответствие версии схемы или поврежденные данные");
    }

    return { 
      ok: true, 
      source: "storage", 
      tasks: structuredClone(parsed.tasks) 
    };

  } catch (error) {
    console.warn(`[loadTasks] Ошибка загрузки: ${error.message}. Используется исходный набор.`);
    return { 
      ok: false, 
      source: "fallback", 
      tasks: safeFallback, 
      error: error.message 
    };
  }
}


export function saveTasks(storage, key, tasks) {
  try {
    if (!isValidTaskList(tasks)) {
      throw new Error("Невозможно сохранить некорректный список задач");
    }

    const data = {
      version: STORAGE_VERSION,
      tasks: tasks
    };

    storage.setItem(key, JSON.stringify(data));
    return { ok: true };

  } catch (error) {
    console.error(`[saveTasks] Ошибка сохранения: ${error.message}`);
    return { 
      ok: false, 
      error: error.message 
    };
  }
}


export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    console.error(`[removeSavedTasks] Ошибка удаления ключа "${key}": ${error.message}`);
    return { 
      ok: false, 
      error: error.message 
    };
  }
}