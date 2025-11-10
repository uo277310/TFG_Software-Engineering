/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API
 *              to optimize client-server interaction by avoiding polling.
 * File: WebSocketSubscription.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
 */

WSLibrary.WebSocketSubscription = class {
    #webSocket = null;
    #notificationHandler = null;
    #stateName = "";
    #handleWebSocketMessageCallback = null;

    constructor(webSocket, notificationHandler, state) {
        this.#webSocket = webSocket;
        this.#notificationHandler = notificationHandler;
        this.#stateName = state;
        this.#handleWebSocketMessageCallback = this.#HandleWebSocketMessage.bind(this); // Lo asigno a variable para poder hacer addEventListener y removeEventListener. Véase https://stackoverflow.com/a/22870717/2646758 

        // Subscribe to the state
        console.log(JSON.stringify({ action: 'subscribe', stateName: this.#stateName }));
        this.#webSocket.send(JSON.stringify({ action: 'subscribe', stateName: this.#stateName }));

        // Attach the event listener for the 'message' event
        this.#webSocket.addEventListener('message', this.#handleWebSocketMessageCallback);
    }

    Unsubscribe() {
        this.#webSocket.removeEventListener('message', this.#handleWebSocketMessageCallback);

        this.#webSocket.send(JSON.stringify({ action: 'unsubscribe', stateName: this.#stateName }));
    }

    #HandleWebSocketMessage(event) {
        // Parse incoming message and only notify if it matches this subscription's state
        let parsed;
        try {
            parsed = JSON.parse(event.data);
        } catch (e) {
            // Ignore malformed messages
            return;
        }

        const { stateName, newValue } = parsed;

        // Only notify the handler if the message is for the state this subscription is subscribed to
        if (stateName !== this.#stateName) return;

        console.log(`Mensaje recibido para ${stateName}: ${event.data}`);

        if (this.#notificationHandler !== null) {
            // We assume that the notificationHandler object has a method NotifyWebSocketMessage(stateName, newValue)
            this.#notificationHandler.NotifyWebSocketMessage(stateName, newValue);
        }
    }

};