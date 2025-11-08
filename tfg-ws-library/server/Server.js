/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API 
 *              to optimize client-server interaction by avoiding polling.
 * File: Server.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
*/

require("./WSLibrary.js");
require("./Settings.js");
require("./LibraryStateCache.js");
require("./LibraryStateSubscription.js");
require("./LibraryStateSubscriptionIterator.js");
require("./LibraryStateSubscriptionManager.js");
require("./YahooFinanceLibraryAdapter.js");
require("./WebSocketManager.js");

const host = "localhost";
const port = 3000;

const yahooFinanceLibraryAdapter = new WSLibrary.YahooFinanceLibraryAdapter();
const webSocketManager = new WSLibrary.WebSocketManager(host, port, yahooFinanceLibraryAdapter);

try {
    webSocketManager.Start();
    console.log(`WebSocket server started on ws://${host}:${port}`);
} catch (error) {
    console.error("Error starting the WebSocket server:", error);
    process.exit(1);
}