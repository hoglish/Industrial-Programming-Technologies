"use strict";

function runTaskCheck(totalTasks, completedTasks) {
    console.log(`--- Тест: totalTasks=${totalTasks}, completedTasks=${completedTasks} ---`);
    
    if (typeof totalTasks !== "number" || typeof completedTasks !== "number") {
        if (typeof totalTasks === "string" || typeof completedTasks === "string") {
            console.log("Ошибка: вместо числа передана строка.");
        } else {
            console.log("Ошибка: недопустимое числовое значение.");
        }
    } else if (Number.isNaN(totalTasks) || Number.isNaN(completedTasks)) {
        console.log("Ошибка: недопустимое числовое значение.");
    } else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
        console.log("Ошибка: дробное количество.");
    } else if (totalTasks < 0 || completedTasks < 0) {
        console.log("Ошибка: отрицательное количество.");
    } else if (totalTasks > 1000) {
        console.log("Ошибка: превышена верхняя граница.");
    } else if (completedTasks > totalTasks) {
        console.log("Ошибка: выполнено больше, чем существует.");
    } else {
        if (totalTasks === 0 && completedTasks === 0) {
            console.log("Задач пока нет");
        } else {
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
    }
    console.log("");
}

runTaskCheck(12, 5);
runTaskCheck(0, 0);
runTaskCheck(5, 0);
runTaskCheck(5, 5);
runTaskCheck(5, 6);
runTaskCheck(-1, 0);
runTaskCheck(5, 2.5);
runTaskCheck("5", 2);
runTaskCheck(1001, 0);
runTaskCheck(NaN, 0);