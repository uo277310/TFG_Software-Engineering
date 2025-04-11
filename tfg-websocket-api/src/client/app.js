/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API
 *              to optimize client-server interaction by avoiding polling.
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
 */

// Initialize WebSocket connection to the server
const ws = new WebSocket('ws://localhost:3000');

// Stores price history and chart references
const priceHistory = {};

// Symbols grouped by category
const symbolsByCategory = {
    stocks: ["AAPL", "GOOGL", "TSLA", "AMZN", "MSFT"],
    crypto: ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "XRP-USD"],
    forex: ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCAD=X", "AUDUSD=X"]
};

// Keeps track of all currently subscribed symbols
let subscribedSymbols = [];

// Updates the symbol options and UI state after subscribing or unsubscribing
function updateSymbolOptions() {
    const categorySelect = document.getElementById('categorySelect');
    const symbolSelect = document.getElementById('symbolSelect');
    const currentCategory = categorySelect.value;

    // Clear previous symbol options
    symbolSelect.innerHTML = '';

    let hasSymbols = false;

    // Only add symbols that are not already subscribed
    symbolsByCategory[currentCategory].forEach(symbol => {
        if (!subscribedSymbols.includes(symbol)) {
            const option = document.createElement('option');
            option.value = symbol;
            option.textContent = symbol;
            symbolSelect.appendChild(option);
            hasSymbols = true;
        }
    });

    // If no symbols remain in this category, switch to the next available one
    if (!hasSymbols) {
        const nextCategory = getNextAvailableCategory(currentCategory);
        if (nextCategory) {
            categorySelect.value = nextCategory;
            updateSymbolOptions(); // Re-run update to show next category
        } else {
            categorySelect.value = ''; // Clear selection if none are left
        }
    }

    updateCategoryOptions(); // Refresh category list
    updateSubscriptionUIState(); // Update subscription state
}

// Update subscription UI state (disable/enable buttons)
function updateSubscriptionUIState() {
    const categorySelect = document.getElementById('categorySelect');
    const symbolSelect = document.getElementById('symbolSelect');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const subscriptionContainer = document.querySelector('.flex.justify-center'); // Container for subscription options

    // Check if any symbol in any category is unsubscribed
    const anyAvailable = Object.values(symbolsByCategory).some(symbols =>
        symbols.some(symbol => !subscribedSymbols.includes(symbol))
    );

    // Enable or disable inputs based on availability
    categorySelect.disabled = !anyAvailable;
    symbolSelect.disabled = !anyAvailable;
    subscribeBtn.disabled = !anyAvailable;

    // Show or hide the subscription options container
    subscriptionContainer.style.display = anyAvailable ? 'flex' : 'none';
}

// Returns the next category that still has unsubscribed symbols
function getNextAvailableCategory(currentCategory) {
    const categories = ['stocks', 'crypto', 'forex'];
    const currentIndex = categories.indexOf(currentCategory);
    for (let i = currentIndex + 1; i < categories.length; i++) {
        if (symbolsByCategory[categories[i]].some(symbol => !subscribedSymbols.includes(symbol))) {
            return categories[i];
        }
    }
    return null;
}

// Updates the category options based on available symbols
function updateCategoryOptions() {
    const categorySelect = document.getElementById('categorySelect');
    // Save the current selection
    const currentSelection = categorySelect.value;

    // Get all categories with at least one unsubscribed symbol
    const availableCategories = Object.keys(symbolsByCategory)
        .filter(category =>
            symbolsByCategory[category].some(symbol => !subscribedSymbols.includes(symbol))
        )
        .sort((a, b) => {
            // Sort based on display labels (for example, "Acciones 📊")
            return getCategoryLabel(a).localeCompare(getCategoryLabel(b));
        });

    // Clear existing options
    categorySelect.innerHTML = '';

    // Add sorted, available categories
    availableCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = getCategoryLabel(category);
        categorySelect.appendChild(option);
    });

    // If the current selection is still available, reselect it; otherwise, select the first available category
    if (availableCategories.includes(currentSelection)) {
        categorySelect.value = currentSelection;
    } else {
        categorySelect.value = availableCategories[0] || '';
    }
}

// Returns display label for each category
function getCategoryLabel(category) {
    switch (category) {
        case 'stocks':
            return 'Acciones 📊';
        case 'crypto':
            return 'Criptomonedas ₿';
        case 'forex':
            return 'Divisas 💱';
        default:
            return '';
    }
}

// Handles symbol subscription
function subscribe() {
    const symbol = document.getElementById('symbolSelect').value;
    const category = document.getElementById('categorySelect').value;

    if (!subscribedSymbols.includes(symbol)) {
        subscribedSymbols.push(symbol);
        updateSymbolOptions();

        // Notify server via WebSocket
        ws.send(JSON.stringify({ action: 'subscribe', symbol }));
        logToConsole(`🔔 Suscripción a ${symbol}`);
        createPriceSection(symbol, category);
    }
}

// Populate initial symbol options when page loads
updateSymbolOptions();

// Adds a new UI section for displaying prices and chart
function createPriceSection(symbol, category) {
    const container = document.getElementById(`${category}Container`);
    const section = document.createElement('div');
    section.id = `section-${symbol}`;
    // Set base class (default to dark mode)
    section.className = "p-3 bg-gray-800 rounded shadow-lg";

    section.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">${symbol}</h3>
        <div id="info-${symbol}" class="text-xl mb-2">Precio actual: <span class="price">---</span></div>
        <canvas id="chart-${symbol}" width="150" height="100"></canvas>
        <button onclick="unsubscribe('${symbol}')" class="mt-2 bg-red-500 p-1 rounded">✖️ Desuscribir</button>
    `;

    container.appendChild(section);

    // Adjust section styles based on current theme
    const app = document.getElementById('app');
    if (app.classList.contains('bg-gray-900')) {
        // Dark mode: set dark background and white text
        section.style.backgroundColor = '#1F2937'; // similar to bg-gray-800
        section.style.color = '#fff';
        // Force price text to appear white initially in dark mode
        const priceSpan = section.querySelector('.price');
        if (priceSpan) {
            priceSpan.style.color = '#fff';
        }
        // Force all button texts to white in dark mode
        section.querySelectorAll('button').forEach(btn => {
            btn.style.color = '#fff';
        });
    } else {
        // Light mode: set white background and black text
        section.style.backgroundColor = '#fff';
        section.style.color = '#000';
        // Update all elements that might be set to white by default
        section.querySelectorAll('.text-white').forEach(el => {
            el.style.color = '#000';
        });
        // Force price text to appear in black initially
        const priceSpan = section.querySelector('.price');
        if (priceSpan) {
            priceSpan.style.color = '#000';
        }
        // Force all button texts to appear white regardless of light mode defaults
        section.querySelectorAll('button').forEach(btn => {
            btn.style.color = '#fff';
        });
    }

    // Initialize the chart with configuration according to the current theme
    priceHistory[symbol] = { prices: [], chart: createChart(symbol) };
}

// Handle incoming messages from the WebSocket
ws.onmessage = (event) => {
    const { symbol, price } = JSON.parse(event.data);
    if (priceHistory[symbol]) {
        updateChart(priceHistory[symbol].chart, price, symbol);
        logToConsole(`📥 Precio actualizado para ${symbol}: $${price}`);
    }
};

// Creates and configures a Chart.js chart for a symbol
function createChart(symbol) {
    const canvas = document.getElementById(`chart-${symbol}`);
    const ctx = canvas.getContext('2d');
    const app = document.getElementById('app');

    let xTickColor, yTickColor, yGridColor, canvasBackground;
    if (app.classList.contains('bg-gray-900')) {
        // Dark mode
        xTickColor = 'rgb(175, 192, 192)';
        yTickColor = 'rgb(175, 192, 192)';
        yGridColor = 'rgb(175, 192, 192)';
        canvasBackground = 'rgba(31, 41, 55, 0.8)';
    } else {
        // Light mode
        xTickColor = 'rgb(0, 0, 0)';
        yTickColor = 'rgb(0, 0, 0)';
        yGridColor = 'rgba(0, 0, 0, 0.2)';
        canvasBackground = '#fff';
    }
    canvas.style.backgroundColor = canvasBackground;

    return new Chart(ctx, {
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
                x: {
                    display: true,
                    ticks: { font: { size: 10 }, color: xTickColor }
                },
                y: {
                    display: true,
                    ticks: { font: { size: 10 }, color: yTickColor },
                    grid: { color: yGridColor }
                }
            }
        }
    });
}

// Updates the chart and its visual appearance based on price changes
function updateChart(chart, newPrice, symbol) {
    const dataset = chart.data.datasets[0];
    const data = dataset.data;
    const labels = chart.data.labels;
    const now = new Date().toLocaleTimeString();

    labels.push(now);
    data.push(newPrice);

    // Determine price trend compared to the first (leftmost) point
    let trend = 'same';
    if (data.length > 1) {
        const firstPrice = data[0];
        trend = newPrice > firstPrice ? 'up' : newPrice < firstPrice ? 'down' : 'same';
    }

    // Assign color based on trend
    const pointColor = trend === 'up' ? 'rgb(0, 255, 0)' :
                       trend === 'down' ? 'rgb(255, 80, 80)' :
                       'rgb(175, 175, 175)';

    dataset.pointBackgroundColor = data.map(() => pointColor);
    dataset.pointBorderColor = data.map(() => pointColor);
    dataset.borderColor = pointColor;
    dataset.backgroundColor = pointColor.replace('rgb', 'rgba').replace(')', ', 0.2)');

    // Keep last 20 points only
    if (data.length > 20) {
        data.shift();
        labels.shift();
        dataset.pointBackgroundColor.shift();
        dataset.pointBorderColor.shift();
    }

    chart.update('none');

    // Update the visual price text
    const infoDiv = document.getElementById(`info-${symbol}`);
    const priceSpan = infoDiv.querySelector('.price');
    const arrow = trend === 'up' ? '🔼' : trend === 'down' ? '🔽' : '';
    priceSpan.innerHTML = `${newPrice.toFixed(2)} ${arrow}`;
    priceSpan.className = `price ${trend}`;

    // Force the price text color to update immediately when a new point is added
    const app = document.getElementById('app');
    if (app.classList.contains('bg-gray-900')) { // Dark mode
        if (trend === 'up') {
            priceSpan.style.color = 'rgb(0, 255, 0)';
        } else if (trend === 'down') {
            priceSpan.style.color = 'rgb(255, 0, 0)';
        } else {
            priceSpan.style.color = '#fff';
        }
    } else { // Light mode
        if (trend === 'up') {
            priceSpan.style.color = 'rgb(0, 255, 0)';
        } else if (trend === 'down') {
            priceSpan.style.color = 'rgb(255, 0, 0)';
        } else {
            priceSpan.style.color = '#000';
        }
    }
}

// Handles unsubscription and UI cleanup
function unsubscribe(symbol) {
    if (priceHistory[symbol]) {
        ws.send(JSON.stringify({ action: 'unsubscribe', symbol }));
        logToConsole(`❌ Unsubscribed from ${symbol}`);
        delete priceHistory[symbol];
        const section = document.getElementById(`section-${symbol}`);
        if (section) section.remove();

        // Remove from the subscribed list
        subscribedSymbols = subscribedSymbols.filter(s => s !== symbol);

        // Refresh dropdowns and UI state
        updateCategoryOptions(); // Refresh category options
        updateSymbolOptions();   // Update available symbols
        updateSubscriptionUIState(); // Update UI state
    }
}

// Switch between light/dark theme
function toggleTheme() {
    const app = document.getElementById('app');
    const themeToggleBtn = document.getElementById('themeToggle');
    const isDark = app.classList.contains('bg-gray-900');

    if (isDark) {
        app.classList.remove('bg-gray-900', 'text-white');
        app.classList.add('bg-white', 'text-gray-900');
        themeToggleBtn.textContent = '🌙 Modo Oscuro';
        localStorage.setItem('theme', 'light');
    } else {
        app.classList.remove('bg-white', 'text-gray-900');
        app.classList.add('bg-gray-900', 'text-white');
        themeToggleBtn.textContent = '☀️ Modo Claro';
        localStorage.setItem('theme', 'dark');
    }

    // Update chart and section colors based on the current theme
    Object.keys(priceHistory).forEach(symbol => {
        const { chart } = priceHistory[symbol];
        const section = document.getElementById(`section-${symbol}`);

        if (app.classList.contains('bg-gray-900')) {
            // Dark mode
            chart.options.scales.x.ticks.color = 'rgb(175, 192, 192)';
            chart.options.scales.y.ticks.color = 'rgb(175, 192, 192)';
            chart.options.scales.y.grid.color = 'rgb(175, 192, 192)';
            chart.canvas.style.backgroundColor = 'rgba(31, 41, 55, 0.8)';

            if (section) {
                section.style.backgroundColor = '#1F2937';
                section.style.color = '#fff';
                section.querySelectorAll('*').forEach(el => {
                    el.style.color = '#fff';
                });
                // Force the price text to follow the current trend in dark mode
                const priceSpan = section.querySelector('.price');
                if (priceSpan) {
                    if (priceSpan.classList.contains('up')) {
                        priceSpan.style.color = 'rgb(0, 255, 0)';
                    } else if (priceSpan.classList.contains('down')) {
                        priceSpan.style.color = 'rgb(255, 0, 0)';
                    } else {
                        priceSpan.style.color = '#fff';
                    }
                }
                // Force button texts to white regardless of theme
                section.querySelectorAll('button').forEach(btn => {
                    btn.style.color = '#fff';
                });
            }
        } else {
            // Light mode
            chart.options.scales.x.ticks.color = 'rgb(0, 0, 0)';
            chart.options.scales.y.ticks.color = 'rgb(0, 0, 0)';
            chart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.2)';
            chart.canvas.style.backgroundColor = '#fff';

            if (section) {
                section.style.backgroundColor = '#fff';
                section.style.color = '#000';
                section.querySelectorAll('*').forEach(el => {
                    el.style.color = '#000';
                });
                // Force the price text to follow the trend in light mode (green for up, red for down, black otherwise)
                const priceSpan = section.querySelector('.price');
                if (priceSpan) {
                    if (priceSpan.classList.contains('up')) {
                        priceSpan.style.color = 'rgb(0, 255, 0)';
                    } else if (priceSpan.classList.contains('down')) {
                        priceSpan.style.color = 'rgb(255, 0, 0)';
                    } else {
                        priceSpan.style.color = '#000';
                    }
                }
                // Force button texts to white regardless of theme
                section.querySelectorAll('button').forEach(btn => {
                    btn.style.color = '#fff';
                });
            }
        }
        chart.update('none');
    });
    
    // Force the subscribe button and the theme toggle button text to white regardless of theme.
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (subscribeBtn) {
        subscribeBtn.style.color = '#fff';
    }
    themeToggleBtn.style.color = '#fff';
}

// Loads theme preference from localStorage on startup
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

// Logging helper that groups logs every 5 seconds
let lastLoggedBlock = null;
function logToConsole(message) {
    const consoleBody = document.getElementById('consoleBody');
    const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
    const now = new Date();
    const currentSecond = now.getSeconds();
    const currentBlock = Math.floor(currentSecond / 5);

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
        scrollToBottomBtn.classList.add('hidden');
    } else {
        scrollToBottomBtn.classList.remove('hidden');
    }
}

// Scrolls the console to the bottom
function scrollDown() {
    const consoleBody = document.getElementById('consoleBody');
    consoleBody.scrollTop = consoleBody.scrollHeight;

    const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
    scrollToBottomBtn.classList.add('hidden');
}

// Toggles visibility of the visual WebSocket console
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

// Restore console visibility state from localStorage
(function restoreConsoleState() {
    const visible = localStorage.getItem('consoleVisible');
    const consoleBody = document.getElementById('consoleBody');
    const toggleBtn = document.getElementById('consoleToggleBtn');

    if (visible === 'false') {
        consoleBody.style.display = 'none';
        toggleBtn.textContent = '🔼 Maximizar';
    }
})();