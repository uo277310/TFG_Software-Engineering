/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API
 *              to optimize client-server interaction by avoiding polling.
 * File: WebSocketSubscriptionManager.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
 */

WSLibrary.WebSocketSubscriptionManager = class {

    static sInstance = null; // The only instance of the class.
    static sGettingInstance = false; // A Boolean flag to assert that the object is always constructed from within the GetInstance static method.

    #webSocket = null;
    #webSocketSubscriptionMap = null;

    /*
     * This is the singleton's GetInstance method that provides access to the only object of this type.
     */
    static GetInstance() {
        if (WSLibrary.WebSocketSubscriptionManager.sInstance === null) {
            WSLibrary.WebSocketSubscriptionManager.sGettingInstance = true;
            WSLibrary.WebSocketSubscriptionManager.sInstance = new WSLibrary.WebSocketSubscriptionManager();
            WSLibrary.WebSocketSubscriptionManager.sGettingInstance = false;
        }
        return WSLibrary.WebSocketSubscriptionManager.sInstance;
    }

    /*
     * This is the constructor of the class.
     */
    constructor() {
        if (!WSLibrary.WebSocketSubscriptionManager.sGettingInstance)
            throw new Error("Invalid construction of WebSocketSubscriptionManager class bypassing the static GetInstance method which must always be used");
    }

    InitializeWebSocket(webSocketHost, webSocketPort) {
        if (this.#webSocket !== null)
            throw new Error("WSLibrary.WebSocketSubscriptionManager.InitializeWebSocket can only be called once");

        // Aquí se podrían validar los parámetros: que webSocketHost sea almenos una cadena de texto y que webSocketPort sea un número (entre 1 y 65535) 
        this.#webSocket = new WebSocket("ws://" + webSocketHost + ":" + webSocketPort.toString());
        this.#webSocketSubscriptionMap = new Map();
    }

    /*
     * This method acquires a subscription to a given state name, creating a new WebSocketSubscription object if necessary.
     */
    AcquireSubscription(webSocketNotificationHandler, stateName) {
        if (this.#webSocket === null)
            throw new Error("WSLibrary.WebSocketSubscriptionManager.InitializeWebSocket must be called once before acquiring any subscription");

        let newActiveWebSocketSubscription = null;

        if (this.#webSocketSubscriptionMap.has(stateName)) {
            throw new Error("attempting to subscribe to a state twice; this version of the WSLibrary does not support multiple subscriptions");
        }
        else {
            newActiveWebSocketSubscription = new WSLibrary.WebSocketSubscription(this.#webSocket, webSocketNotificationHandler, stateName);
            this.#webSocketSubscriptionMap.set(stateName, newActiveWebSocketSubscription);
        }
        return newActiveWebSocketSubscription;
    }

    /*
     * This method releases a subscription to a given state name.
     */
    ReleaseSubscription(stateName) // Continuando con el "to do " de arriba, el parámetro tendría que ser webSocketSubscription para admitir suscriptores múltiples.
    {
        if (this.#webSocketSubscriptionMap.has(stateName)) {
            const webSocketSubscription = this.#webSocketSubscriptionMap.get(stateName);
            webSocketSubscription.Unsubscribe();
            this.#webSocketSubscriptionMap.delete(stateName);
        }
    }
};