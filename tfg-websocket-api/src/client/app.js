const ws = new WebSocket('ws://localhost:3000');
const priceHistory = {};
const symbolsByCategory = {
    stocks: ["AAPL", "GOOGL", "TSLA", "AMZN", "MSFT"],
    crypto: ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "XRP-USD"],
    forex: ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCAD=X", "AUDUSD=X"]
};

let subscribedSymbols = [];

function updateSymbolOptions() {
    const categorySelect = document.getElementById('categorySelect');
    const symbolSelect = document.getElementById('symbolSelect');
    const currentCategory = categorySelect.value;

    symbolSelect.innerHTML = ''; // Limpiar todas las opciones antes de volver a agregarlas

    let hasSymbols = false;

    // Añadir solo los símbolos que no han sido suscritos
    symbolsByCategory[currentCategory].forEach(symbol => {
        if (!subscribedSymbols.includes(symbol)) {
            const option = document.createElement('option');
            option.value = symbol;
            option.textContent = symbol;
            symbolSelect.appendChild(option);
            hasSymbols = true;
        }
    });

    // Si no hay símbolos en la categoría seleccionada, intentar seleccionar otra categoría disponible
    if (!hasSymbols) {
        // Buscar la siguiente categoría con símbolos no suscritos
        const nextCategory = getNextAvailableCategory(currentCategory);
        if (nextCategory) {
            categorySelect.value = nextCategory;
            updateSymbolOptions(); // Vuelve a actualizar las opciones de símbolos con la nueva categoría seleccionada
        } else {
            // Si no hay categorías disponibles, eliminamos la opción del selector de categorías
            categorySelect.value = ''; // Esto puede limpiar el selector o seleccionar el valor vacío
        }
    }

    // Actualizar las opciones de categoría disponibles
    updateCategoryOptions();
}

function getNextAvailableCategory(currentCategory) {
    const categories = ['stocks', 'crypto', 'forex'];
    
    // Encontramos la siguiente categoría disponible
    const currentIndex = categories.indexOf(currentCategory);
    for (let i = currentIndex + 1; i < categories.length; i++) {
        if (symbolsByCategory[categories[i]].some(symbol => !subscribedSymbols.includes(symbol))) {
            return categories[i];
        }
    }
    return null; // Si no queda ninguna categoría disponible
}

function updateCategoryOptions() {
    const categorySelect = document.getElementById('categorySelect');
    const categories = ['stocks', 'crypto', 'forex'];

    // Eliminar las categorías que no tengan símbolos disponibles
    categories.forEach(category => {
        const option = categorySelect.querySelector(`option[value="${category}"]`);
        if (!symbolsByCategory[category].some(symbol => !subscribedSymbols.includes(symbol))) {
            if (option) option.remove(); // Eliminar la categoría si no hay símbolos disponibles
        } else {
            if (!option) {
                const newOption = document.createElement('option');
                newOption.value = category;
                newOption.textContent = getCategoryLabel(category);
                categorySelect.appendChild(newOption); // Añadir la opción de categoría si es válida
            }
        }
    });
}

function getCategoryLabel(category) {
    switch (category) {
        case 'stocks':
            return '📊 Acciones';
        case 'crypto':
            return '₿ Criptomonedas';
        case 'forex':
            return '💱 Divisas';
        default:
            return '';
    }
}

function subscribe() {
    const symbol = document.getElementById('symbolSelect').value;
    const category = document.getElementById('categorySelect').value;

    if (!subscribedSymbols.includes(symbol)) {
        // Añadir el símbolo a la lista de suscritos
        subscribedSymbols.push(symbol);

        // Actualizar las opciones disponibles
        updateSymbolOptions();

        // Suscribir al WebSocket
        ws.send(JSON.stringify({ action: 'subscribe', symbol }));
        logToConsole(`🔔 Suscripción a ${symbol}`);
        createPriceSection(symbol, category);
    }
}

updateSymbolOptions(); // Inicializar las opciones al cargar la página

function createPriceSection(symbol, category) {
    const container = document.getElementById(`${category}Container`);
    const section = document.createElement('div');
    section.id = `section-${symbol}`;
    section.className = "p-3 bg-gray-800 rounded shadow-lg";

    section.innerHTML = `
        <h3 class="text-lg font-semibold mb-2 text-white">${symbol}</h3>
        <div id="info-${symbol}" class="text-xl mb-2 text-white">Precio actual: <span class="price">---</span></div>
        <canvas id="chart-${symbol}" width="150" height="100"></canvas>
        <button onclick="unsubscribe('${symbol}')" class="mt-2 bg-red-500 p-1 rounded text-white">❌ Desuscribir</button>
    `;

    container.appendChild(section);
    priceHistory[symbol] = { prices: [], chart: createChart(symbol) };
}

ws.onmessage = (event) => {
    const { symbol, price } = JSON.parse(event.data);
    if (priceHistory[symbol]) {
        updateChart(priceHistory[symbol].chart, price, symbol);
        logToConsole(`📥 Precio actualizado para ${symbol}: $${price}`);
    }
};

function createChart(symbol) {
    const canvas = document.getElementById(`chart-${symbol}`);
    const ctx = canvas.getContext('2d');
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: `${symbol} - Precio`,
                data: [],
                fill: true,
                tension: 0.1,
                pointBackgroundColor: [],
                pointBorderColor: [],
                pointRadius: 4
            }],
        },
        options: {
            responsive: true,
            animation: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { display: true, ticks: { font: { size: 10 }, color: 'rgb(175, 192, 192)' } },
                y: {
                    display: true,
                    ticks: { font: { size: 10 }, color: 'rgb(175, 192, 192)' },
                    grid: { color: 'rgb(175, 192, 192)' }
                }
            }
        }
    });

    return chart;
}

function updateChart(chart, newPrice, symbol) {
    const dataset = chart.data.datasets[0];
    const data = dataset.data;
    const labels = chart.data.labels;
    const now = new Date().toLocaleTimeString();

    labels.push(now);
    data.push(newPrice);

    // Inicializa pointBackgroundColor si no existe
    if (!dataset.pointBackgroundColor) {
        dataset.pointBackgroundColor = [];
    }

    let trend = 'same';
    if (data.length > 1) {
        const prev = data[data.length - 2];
        trend = newPrice > prev ? 'up' : newPrice < prev ? 'down' : 'same';
    }

    // Color del punto en función de la tendencia
    const pointColor = trend === 'up' ? 'rgb(0, 255, 0)' :
                       trend === 'down' ? 'rgb(255, 80, 80)' :
                       'rgb(175, 175, 175)';

    dataset.pointBackgroundColor = data.map(() => pointColor);
    dataset.pointBorderColor = data.map(() => pointColor);

    // Limitar longitud para mantener 20 puntos
    if (data.length > 20) {
        data.shift();
        labels.shift();
        dataset.pointBackgroundColor.shift();
        dataset.pointBorderColor.shift();
    }

    // También cambia el color de la línea
    dataset.borderColor = trend === 'up' ? 'rgb(0, 255, 0)' :
        trend === 'down' ? 'rgb(255, 80, 80)' : 'rgb(175, 175, 175)';

    dataset.backgroundColor = trend === 'up' ? 'rgba(0, 255, 0, 0.2)' :
        trend === 'down' ? 'rgba(255, 80, 80, 0.2)' : 'rgba(175, 175, 175, 0.2)';

    chart.update('none');

    const infoDiv = document.getElementById(`info-${symbol}`);
    const priceSpan = infoDiv.querySelector('.price');

    let arrow = trend === 'up' ? '🔼' : trend === 'down' ? '🔽' : '';
    priceSpan.innerHTML = `${newPrice.toFixed(2)} ${arrow}`;
    priceSpan.className = `price ${trend}`;
}

function unsubscribe(symbol) {
    if (priceHistory[symbol]) {
        ws.send(JSON.stringify({ action: 'unsubscribe', symbol }));
        logToConsole(`❌ Desuscripción de ${symbol}`);
        delete priceHistory[symbol];
        const section = document.getElementById(`section-${symbol}`);
        if (section) section.remove();
    }
}

function toggleTheme() {
    const app = document.getElementById('app');
    const button = document.getElementById('themeToggle');
    const isDark = app.classList.contains('bg-gray-900');

    if (isDark) {
        app.classList.remove('bg-gray-900', 'text-white');
        app.classList.add('bg-white', 'text-gray-900');
        button.textContent = '🌙 Modo Oscuro';
        localStorage.setItem('theme', 'light');
    } else {
        app.classList.remove('bg-white', 'text-gray-900');
        app.classList.add('bg-gray-900', 'text-white');
        button.textContent = '☀️ Modo Claro';
        localStorage.setItem('theme', 'dark');
    }
}

(function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const app = document.getElementById('app');
    const button = document.getElementById('themeToggle');

    if (savedTheme === 'light') {
        app.classList.remove('bg-gray-900', 'text-white');
        app.classList.add('bg-white', 'text-gray-900');
        button.textContent = '🌙 Modo Oscuro';
    } else {
        app.classList.remove('bg-white', 'text-gray-900');
        app.classList.add('bg-gray-900', 'text-white');
        button.textContent = '☀️ Modo Claro';
    }
})();

let lastLoggedBlock = null;
function logToConsole(message) {
    const consoleBody = document.getElementById('consoleBody');
    const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
    const now = new Date();
    const currentSecond = now.getSeconds();
    const currentBlock = Math.floor(currentSecond / 5); // Agrupación por bloques de 5s

    const isAtBottom = consoleBody.scrollHeight == consoleBody.scrollTop + consoleBody.clientHeight;

    if (lastLoggedBlock !== currentBlock) {
        const separator = document.createElement('div');
        separator.innerHTML = `
            <div class="flex items-center gap-2 text-sm text-indigo-400 mt-2 mb-1">
                <span class="flex-grow border-t border-indigo-400"></span>
                <span class="font-mono">🕒 ${now.toLocaleTimeString()}</span>
                <span class="flex-grow border-t border-indigo-400"></span>
            </div>
        `;
        consoleBody.appendChild(separator);
        lastLoggedBlock = currentBlock;
    }

    const entry = document.createElement('div');
    entry.textContent = `[${now.toLocaleTimeString()}] ${message}`;
    consoleBody.appendChild(entry);

    if (isAtBottom) {
        consoleBody.scrollTop = consoleBody.scrollHeight;
        scrollToBottomBtn.classList.add('hidden'); // Ocultar el botón
    } else {
        scrollToBottomBtn.classList.remove('hidden'); // Mostrar el botón
    }
}

function scrollDown() {
    const consoleBody = document.getElementById('consoleBody');
    consoleBody.scrollTop = consoleBody.scrollHeight;
    
    const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
    scrollToBottomBtn.classList.add('hidden');
};

function toggleConsole() {
    const consoleDiv = document.getElementById('websocketConsole');
    const consoleBody = document.getElementById('consoleBody');
    const toggleBtn = document.getElementById('consoleToggleBtn');

    const isHidden = consoleBody.style.display === 'none';

    if (isHidden) {
        consoleBody.style.display = 'block';
        toggleBtn.textContent = '🔽 Minimizar';
        localStorage.setItem('consoleVisible', 'true');
    } else {
        const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
        scrollToBottomBtn.classList.add('hidden');

        consoleBody.style.display = 'none';
        toggleBtn.textContent = '🔼 Maximizar';
        localStorage.setItem('consoleVisible', 'false');
    }
}

(function restoreConsoleState() {
    const visible = localStorage.getItem('consoleVisible');
    const consoleBody = document.getElementById('consoleBody');
    const toggleBtn = document.getElementById('consoleToggleBtn');

    if (visible === 'false') {
        consoleBody.style.display = 'none';
        toggleBtn.textContent = '🔼 Maximizar';
    }
})();