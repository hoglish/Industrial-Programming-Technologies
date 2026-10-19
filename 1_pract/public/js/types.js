function printResults(value){
    console.log(`Результат: ${value}`);
    console.log(`Тип результата: ${typeof value}`);
};

var result = "8" + 2;
printResults(result);

result = "8" - 2;
printResults(result);

result = Number("8") + 2;
printResults(result);

result = "12" > "3";
printResults(result)

result = 12 === "12";
printResults(result)

result = Number("")
printResults(result)

result = Number("text")
printResults(result)

result = Boolean("false")
printResults(result)

result = typeof null
printResults(result)

result=typeof NaN
printResults(result)