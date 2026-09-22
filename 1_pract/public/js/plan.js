"use strict";

function runPlanCheck(totalTasks, completedTasks, dailyLimit) {
    console.log(`--- Тест: totalTasks=${totalTasks}, completedTasks=${completedTasks}, dailyLimit=${dailyLimit} ---`);

    if (typeof totalTasks !== "number" || typeof completedTasks !== "number" || typeof dailyLimit !== "number" || Number.isNaN(totalTasks) || Number.isNaN(completedTasks) || Number.isNaN(dailyLimit)) {
        if (typeof totalTasks === "string" || typeof completedTasks === "string" || typeof dailyLimit === "string") {
             console.log("Ошибка: введенные данные не являются числами или норма задана строкой.");
        } else {
            console.log("Ошибка: недопустимое числовое значение.");
        }
    } else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks) || !Number.isInteger(dailyLimit)) {
        console.log("Ошибка: дробной дневной нормы быть не должно.");
    } else if (totalTasks < 0 || completedTasks < 0) {
        console.log("Ошибка: отрицательное количество.");
    } else if (totalTasks > 1000) {
        console.log("Ошибка: превышена верхняя граница.");
    } else if (completedTasks > totalTasks) {
        console.log("Ошибка: некорректное число выполненных задач.");
    } else if (dailyLimit < 1 || dailyLimit > 1000) {
        if (dailyLimit === 0) {
            console.log("Ошибка; цикл не запускается.");
        } else {
            console.log("Ошибка: превышена верхняя граница нормы.");
        }
    } else {
        if (totalTasks === completedTasks) {
            console.log("Все задачи уже выполнены.");
            console.log("Потребуется дней: 0");
        } else {
            let remainingTasks = totalTasks - completedTasks;
            let day = 0;

            console.log(`Осталось задач: ${remainingTasks}`);

            while (remainingTasks > 0) {
                day++;
                let tasksDoneToday = Math.min(remainingTasks, dailyLimit);
                
                remainingTasks -= tasksDoneToday;

                console.log(`День ${day}: выполнено ${tasksDoneToday}, осталось ${remainingTasks}`);
            }

            console.log(`Потребуется дней: ${day}`);
        }
    }
    console.log("");
}

runPlanCheck(12, 5, 3);
runPlanCheck(10, 4, 3);
runPlanCheck(5, 3, 10);
runPlanCheck(5, 5, 2);
runPlanCheck(0, 0, 2);
runPlanCheck(5, 2, 0);
runPlanCheck(5, 2, 1.5);
runPlanCheck(5, 6, 2);
runPlanCheck(5, 2, "2");
runPlanCheck(5, 2, 1001);