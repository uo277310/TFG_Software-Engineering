// server.js
const WebSocket = require('ws');
const yahooFinance = require('yahoo-finance2').default;

const wss = new WebSocket.Server({ port: 3000 });
console.log('Servidor WebSocket corriendo en ws://localhost:3000');

const clients = new Map(); // Mapear clientes a sus suscripciones

// Manejar conexiones WebSocket
wss.on('connection', (ws) => {
    console.log('Cliente conectado');

    // Inicializar suscripciones vacías para el cliente
    clients.set(ws, new Set());

    ws.on('message', async (message) => {
        try {
            const { action, symbol } = JSON.parse(message);

            if (action === 'subscribe' && symbol) {
                console.log(`Cliente suscrito a: ${symbol}`);

                // Añadir el símbolo a las suscripciones del cliente
                clients.get(ws).add(symbol);
            }
        } catch (error) {
            console.error('Error al procesar el mensaje:', error);
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
        clients.delete(ws);
    });
});

// Obtener precios y enviar actualizaciones a los clientes
async function fetchAndBroadcast() {
    for (const [client, symbols] of clients.entries()) {
        for (const symbol of symbols) {
            try {
                const result = await yahooFinance.quote(symbol);
                const price = result.regularMarketPrice;

                if (price) {
                    client.send(JSON.stringify({ symbol, price }));
                }
            } catch (error) {
                console.error(`Error al obtener datos de ${symbol}:`, error.message);
            }
        }
    }
}

// Consultar precios cada 5 segundos
setInterval(fetchAndBroadcast, 5000);
