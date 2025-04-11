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

const UPDATE_INTERVAL = 5000; // Update interval in milliseconds

const WebSocket = require('ws');
const yahooFinance = require('yahoo-finance2').default;
yahooFinance.suppressNotices(['yahooSurvey']);

// Create a WebSocket server running on port 3000
const wss = new WebSocket.Server({ port: 3000 });
console.log('WebSocket server running on ws://localhost:3000');

// Map to track clients and their subscriptions
const clients = new Map(); // Map clients to their subscriptions

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Initialize empty subscriptions for the client
    clients.set(ws, new Set());

    // Handle incoming messages from clients
    ws.on('message', async (message) => {
        try {
            const { action, symbol } = JSON.parse(message); // Parse the incoming message
    
            if (action === 'subscribe' && symbol) {
                console.log(`Client subscribed to: ${symbol}`);
                clients.get(ws).add(symbol); // Add symbol to client's subscriptions
            }
    
            if (action === 'unsubscribe' && symbol) {
                console.log(`Client unsubscribed from: ${symbol}`);
                clients.get(ws).delete(symbol); // Remove symbol from client's subscriptions
            }
    
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });    

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws); // Remove client from the map when disconnected
    });
});

// Function to fetch prices and broadcast them to the connected clients
async function fetchAndBroadcast() {
    for (const [client, symbols] of clients.entries()) {
        for (const symbol of symbols) {
            try {
                // Get the latest price for each subscribed symbol using Yahoo Finance API
                const result = await yahooFinance.quote(symbol);
                const price = result.regularMarketPrice; // Extract the price

                if (price) {
                    // Send the updated price to the client
                    client.send(JSON.stringify({ symbol, price }));
                }
            } catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error.message);
            }
        }
    }
}

// Set an interval to fetch and broadcast prices every UPDATE_INTERVAL milliseconds
setInterval(fetchAndBroadcast, UPDATE_INTERVAL);