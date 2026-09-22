"use strict";

function processTasks(totalTasksStr, completedTasksStr) {
    console.log(`--- Входные данные: totalTasks="${totalTasksStr}", completedTasks="${completedTasksStr}" ---`);
    
    if (typeof totalTasksStr !== "string" || typeof completedTasksStr !== "string") {
        console.log("Ошибка: входные данные должны быть строками.");
        return;
    }
    
    const totalTrimmed = totalTasksStr.trim();
    const completedTrimmed = completedTasksStr.trim();
    
    if (totalTrimmed === "" || completedTrimmed === "") {
        console.log("Ошибка: пустой ввод недопустим.");
        return;
    }
    
    const totalTasks = Number(totalTrimmed);
    const completedTasks = Number(completedTrimmed);
    
    if (Number.isNaN(totalTasks) || Number.isNaN(completedTasks)) {
        console.log("Ошибка: недопустимое числовое значение.");
        return;
    }
    
    if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) {
        console.log("Ошибка: значение должно быть конечным числом.");
        return;
    }
    
    if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
        console.log("Ошибка: дробное количество.");
        return;
    }
    
    if (totalTasks < 0 || completedTasks < 0) {
        console.log("Ошибка: отрицательное количество.");
        return;
    }
    
    if (totalTasks > 1000) {
        console.log("Ошибка: превышена верхняя граница.");
        return;
    }
    
    if (completedTasks > totalTasks) {
        console.log("Ошибка: выполнено больше, чем существует.");
        return;
    }
    
    if (totalTasks === 0 && completedTasks === 0) {
        console.log("Задач пока нет");
        return;
    }
    
    const remainingTasks = totalTasks - completedTasks;
    const progressPercent = (completedTasks / totalTasks * 100).toFixed(1);
    
    let status;
    if (completedTasks === 0) {
        status = "Не начато";
    } else if (completedTasks === totalTasks) {
        status = "Завершено";
    } else {
        status = "В работе";
    }

    console.log(`Всего задач: ${totalTasks}`);
    console.log(`Выполнено: ${completedTasks}`);
    console.log(`Осталось: ${remainingTasks}`);
    console.log(`Прогресс: ${progressPercent}%`);
    console.log(`Статус: ${status}`);
}

processTasks("12", "5");
processTasks(" 12 ", " 5 ");
processTasks("", "5");
processTasks("   ", "5");
processTasks("abc", "5");
processTasks("2.5", "5");
processTasks("Infinity", "5");
processTasks(null, "5");
processTasks(undefined, "5");
processTasks("0", "0");
processTasks("5", "0");
processTasks("5", "5");
processTasks("5", "6");
processTasks("-1", "0");
processTasks("1001", "0");