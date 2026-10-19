// src/main.js
import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

console.log("ПР2. Демонстрационный сценарий");
console.log("Количество задач в общем наборе:", demoTasks.length);
console.log("Номер варианта:", variantNumber);
console.log("Количество задач в индивидуальном наборе:", variantTasks.length);

let currentTasks = [];

console.log("\n--- ЭТАП 1: Добавление demoTasks ---");
demoTasks.forEach((item) => {
  const result = addTask(currentTasks, item.id, item.title, item.priority);
  if (result.ok) {
    currentTasks = result.tasks;
  }
});
console.table(currentTasks);

console.log("\n--- ЭТАП 2: Добавление задачи id=20 ---");
const addRes = addTask(currentTasks, 20, "Добавить проверку", "high");
if (addRes.ok) {
  currentTasks = addRes.tasks;
  console.table(currentTasks);
}

console.log("\n--- ЭТАП 3: Изменение статуса выполнения задачи №4 ---");
const completeRes = setTaskCompleted(currentTasks, 4, true);
if (completeRes.ok) {
  currentTasks = completeRes.tasks;
  console.table(currentTasks);
} else {
  console.error("Ошибка:", completeRes.error);
}

console.log("\n--- ЭТАП 4: Переименование задачи №10 ---");
const renameRes = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (renameRes.ok) {
  currentTasks = renameRes.tasks;
  console.table(currentTasks);
} else {
  console.error("Ошибка:", renameRes.error);
}

console.log("\n--- ЭТАП 5: Удаление задачи №7 ---");
const removeRes = removeTask(currentTasks, 7);
if (removeRes.ok) {
  currentTasks = removeRes.tasks;
  console.table(currentTasks);
} else {
  console.error("Ошибка:", removeRes.error);
}

console.log("\n--- ЭТАП 6: Сводка и статистика ---");
const stats = getTaskStats(currentTasks);
const { total, completed, pending, progress } = stats;
console.log(`Всего задач: ${total}`);
console.log(`Выполнено: ${completed}`);
console.log(`Ожидают выполнения: ${pending}`);
if (total === 0) {
  console.log("Задач пока нет");
} else {
  // toFixed применяется только здесь, при выводе
  console.log(`Прогресс: ${progress.toFixed(1)}%`);
}

console.log("\n--- ЭТАП 7: Демонстрация обработки ошибок ---");
const errorRes = addTask(currentTasks, 4, "Дубликат", "low"); // ID 4 уже занят
if (!errorRes.ok) {
  console.log(`Ошибка успешно обработана: "${errorRes.error}"`);
  console.log("Исходные данные не изменились, количество задач:", currentTasks.length);
}

console.log("\n--- ЭТАП 8: Сценарий для индивидуального варианта ---");
let variantState = [];
variantTasks.forEach((item) => {
  const result = addTask(variantState, item.id, item.title, item.priority);
  if (result.ok) {
    variantState = result.tasks;
  }
});
console.log("Задачи индивидуального набора:");
console.table(variantState);
const variantStats = getTaskStats(variantState);
console.log(`Статистика: всего ${variantStats.total}, прогресс ${variantStats.progress.toFixed(1)}%`);


import { searchTasks } from "./task-extra.js"; // Добавьте этот импорт


console.log("\n--- ЭТАП 9: Расширение - Поиск задач ---");

const searchResult1 = searchTasks(currentTasks, " ФУНК ");
console.log("Поиск ' ФУНК ':");
console.table(searchResult1);

const searchResult2 = searchTasks(currentTasks, "несуществующий фрагмент");
console.log("Поиск 'несуществующий фрагмент' (должен быть пуст):", searchResult2);

const searchResult3 = searchTasks(currentTasks, "   ");
console.log("Поиск по пустому запросу (количество задач):", searchResult3.length);