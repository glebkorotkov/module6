const canvas = document.getElementById('myCanvas');
const context = canvas.getContext('2d');
canvas.addEventListener('mousedown', handleMouseDown);

// определяем параметры алгоритма
let numAnts = 10;
let numIterations;
let evaporationRate = 0.5;
let pheromoneMatrix = [];
let alpha = 1;
let beta = 2;
let q = 100;
let initialPheromone = 0.1;
let distances;
// инициализируем матрицу феромонов
let pheromones;
// получаем ввод от пользователя
let points = [];
function handleMouseDown(event) {
    let x = event.clientX - canvas.offsetLeft;
    let y = event.clientY - canvas.offsetTop;
    context.fillStyle = 'black';
    context.beginPath();
    context.arc(x - 8, y - 8, 5, 0, Math.PI * 2);
    context.fill();
    points.push([x, y]);
}
function calcDist(point1, point2) {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    dist = Math.sqrt(dx * dx + dy * dy);
    return dist;
}
function createGraph(dots) {
    let n = dots.length;
    let graph = [];
    let arr = [];
    for (let i = 0; i < n; i++) {
        arr = []
        for (let j = 0; j < n; j++) {
            arr.push(calcDist(dots[i], dots[j]));
        }
        graph.push(arr);
    }
    return graph;
}

function antColonyOptimizationTSP(distanceMatrix, numAnts, numIterations, evaporationRate, alpha, beta, q) {
   // Инициализируем матрицу феромонов постоянным значением
    pheromoneMatrix = [];
    const initialPheromone = 1 / (distanceMatrix.length * Math.sqrt(distanceMatrix.length));
    for (let i = 0; i < distanceMatrix.length; i++) {
        pheromoneMatrix[i] = new Array(distanceMatrix.length).fill(initialPheromone);
    }

    let bestTour;
    let bestTourLength = Number.MAX_VALUE;

    // Повторяем указанное количество итераций
    for (let iteration = 0; iteration < numIterations; iteration++) {
        const ants = [];
        if (iteration % 5 === 0) {
            animate(pheromoneMatrix, distanceMatrix);
        }
        // Создаем муравьев и строим тропы
        for (let antIndex = 0; antIndex < numAnts; antIndex++) {
            const ant = createAnt(distanceMatrix, pheromoneMatrix, alpha, beta);
            ants.push(ant);
        }

        // Обновляем уровни феромонов
        updatePheromoneLevels(ants, distanceMatrix, pheromoneMatrix, evaporationRate, q);

        // Ищем лучшую тропу
        ants.forEach((ant) => {
            const tourLength = calculateTourLength(ant.tour, distanceMatrix);
            if (tourLength < bestTourLength) {
                bestTourLength = tourLength;
                bestTour = ant.tour.slice();
            }
        });
        let path = [];
        for (let i = 0; i < bestTour.length; i++) {
            path.push(points[bestTour[i]]);
        }
        if (iteration % 5 === 0) {
            animatepath(context, path);
        }
    }

    // Возвращаем значение лучшей тропы
    return bestTour;
}

function createAnt(distanceMatrix, pheromoneMatrix, alpha, beta) {
    const numCities = distanceMatrix.length;
    const visited = new Set();
    const tour = [];

    // Выбираем рандомную точку начала алгоритма(муравейник)
    const startCity = Math.floor(Math.random() * numCities);
    tour.push(startCity);
    visited.add(startCity);

    // Повторяем до тех пор пока не посетим все указаные точки 
    while (visited.size < numCities) {
        const currentCity = tour[tour.length - 1];

        // Вычисляем вероятность посещения каждой непосещенной точки 
        const probabilities = [];
        let totalProbability = 0;
        for (let i = 0; i < numCities; i++) {
            if (!visited.has(i)) {
                const pheromoneLevel = pheromoneMatrix[currentCity][i];
                const distance = distanceMatrix[currentCity][i];
                const probability = Math.pow(pheromoneLevel, alpha) * Math.pow(1 / distance, beta);
                probabilities.push({ city: i, probability });
                totalProbability += probability;
            }
        }

        // Выбираем следующщую точку основываясь на вероятности 
        const randomNumber = Math.random() * totalProbability;
        let cumulativeProbability = 0;
        let nextCity;
        for (let i = 0; i < probabilities.length; i++) {
            cumulativeProbability += probabilities[i].probability;
            if (randomNumber <= cumulativeProbability) {
                nextCity = probabilities[i].city;
                break;
            }
        }

        // Идем в следующую точку и отмечаем посещенные
        tour.push(nextCity);
        visited.add(nextCity);
    }

    return { tour };
}

function calculateTourLength(tour, distanceMatrix) {
    let tourLength = 0;
    for (let i = 0; i < tour.length - 1; i++) {
        const fromCity = tour[i];
        const toCity = tour[i + 1];
        tourLength += distanceMatrix[fromCity][toCity];
    }
    // Добавляем расстояние от последнего города до первого и завершаем трип
    tourLength += distanceMatrix[tour[tour.length - 1]][tour[0]];
    return tourLength;
}

function updatePheromoneLevels(ants, distanceMatrix, pheromoneMatrix, evaporationRate, q) {
    // Инициализируем дельта-матрицу
    const deltaMatrix = [];
    for (let i = 0; i < distanceMatrix.length; i++) {
        deltaMatrix[i] = new Array(distanceMatrix.length).fill(0);
    }

    // Для каждого муравья вычисляем качество построенного им пути
    const tourLengths = ants.map((ant) => calculateTourLength(ant.tour, distanceMatrix));

    // Для каждого ребра в обходе каждого муравья добавляем количество феромона в дельта-матрицу
    ants.forEach((ant, antIndex) => {
        const tour = ant.tour;
        const tourLength = tourLengths[antIndex];
        for (let i = 0; i < tour.length - 1; i++) {
            const currentCity = tour[i];
            const nextCity = tour[i + 1];
            deltaMatrix[currentCity][nextCity] += q / tourLength;
            deltaMatrix[nextCity][currentCity] += q / tourLength;
        }
    });

   // Обновляем матрицу феромонов, добавляя дельта-матрицу и применяя испарение
    for (let i = 0; i < pheromoneMatrix.length; i++) {
        for (let j = i + 1; j < pheromoneMatrix.length; j++) {
            pheromoneMatrix[i][j] = (1 - evaporationRate) * pheromoneMatrix[i][j] + deltaMatrix[i][j];
            pheromoneMatrix[j][i] = pheromoneMatrix[i][j];
        }
    }
}

function drawLineThroughPoints(ctx, dots) {
    if (dots.length < 2) {
        return;
    }

    // Перемещаем указатель в первую точку
    ctx.beginPath();
    ctx.moveTo(dots[0][0] - 8, dots[0][1] - 8);

    // Рисуем линию до каждой последующей точки
    for (let i = 1; i < dots.length; i++) {
        ctx.lineTo(dots[i][0] - 8, dots[i][1] - 8);
    }
    // Закрываем путь, чтобы соединить последнюю точку с первой точкой
    ctx.closePath();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    // Обводим путь, чтобы нарисовать линию
    ctx.stroke();
}

function drawPoints(ctx, dots) {
    ctx.fillStyle = 'black';
    ctx.moveTo(dots[0][0], dots[0][1]);
    for (let i = 0; i < dots.length; i++) {
        const x = dots[i][0];
        const y = dots[i][1];
        ctx.beginPath();
        ctx.arc(x - 8, y - 8, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPath(ctx, path) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawLineThroughPoints(ctx, path);
    drawPoints(ctx, points);
}
function drawPheromoneTrails(pheromoneLevels, distanceMatrix) {
    // Очищаем канвас
    context.clearRect(0, 0, canvas.width, canvas.height); 
    // Находим максимальный уровень феромонов для нормализации непрозрачности
    const maxPheromoneLevel = Math.max(...pheromoneLevels.flat());
    // Проходим матрицу расстояний и рисуем линии, пропорциональные уровню феромонов(прозрачность линий)
    for (let i = 0; i < distanceMatrix.length; i++) {
        for (let j = i + 1; j < distanceMatrix[i].length; j++) {
            const pheromoneLevel = pheromoneLevels[i][j];
            const opacity = pheromoneLevel / maxPheromoneLevel;
            // Рисуем только в том случае, если уровень феромонов не равен нулю
            if (opacity > 0) { 
                context.strokeStyle = `rgba(0, 255, 0, ${opacity})`;
                context.lineWidth = 10;
                context.beginPath();
                context.moveTo(points[i][0] - 8, points[i][1] - 8);
                context.lineTo(points[j][0] - 8, points[j][1] - 8);
                context.stroke();
            }
        }
    }
    drawPoints(context, points);
}
function animate(pheromoneLevels, distanceMatrix) {
    // Инициализируем анимации
    let animationFrame = 0;
    const maxFrames = 60;

    // Запускаем цикл анимации
    const animationLoop = setInterval(() => {
        // Рисуем следы феромонов на холсте
        drawPheromoneTrails(pheromoneLevels, distanceMatrix);

        // Проверяем, завершилась ли анимация
        if (++animationFrame >= maxFrames) {
            //Остановливаем цикл анимации
            clearInterval(animationLoop);
        }
    }, 1000 / 30); // 60 фпс
}

function animatepath(context, path) {
    // Инициализируем анимации
    let animationFrame = 0;
    const maxFrames = 60;

    // Запускаем цикл анимации
    const animationLoop = setInterval(() => {
        // Рисуем следы феромонов на холсте
        drawPath(context, path);

        // Проверяем, завершилась ли анимация
        if (++animationFrame >= maxFrames) {
            //Остановливаем цикл анимации
            clearInterval(animationLoop);
        }
    }, 1000 / 30); // 60 фпс
}
function startButton() {
    numIterations = document.getElementById("numIterations").value;
    distances = createGraph(points);
    pheromones = new Array(distances.length).fill().map(() => new Array(distances.length).fill(initialPheromone));
    let ans = antColonyOptimizationTSP(distances, numAnts, numIterations, evaporationRate, alpha, beta, q);
    let path = [];
    for (let i = 0; i < ans.length; i++) {
        path.push(points[ans[i]]);
    }
    animatepath(context, path);
}

function clearButton() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
}