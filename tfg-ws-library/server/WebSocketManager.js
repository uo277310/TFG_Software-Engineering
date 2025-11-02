/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API 
 *              to optimize client-server interaction by avoiding polling.
 * File: WebSocketManager.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
*/

const WebSocket = require('ws');

WSLibrary.WebSocketManager = class
{
    
    #host = ""; // The host for this web socket server.
    #portNumber = ""; // The port number for this web socket server.
    #libraryAdapter = null; // The object that manages the interaction with the external API.
    #libraryStateSubscriptionManager = null; // The object that manages the interaction with the external API to handle the web socket notifications.
    #webSocketServer = null; // The object that manages the web socket server connection.
    #updateIntervalId = -1; // The timer id returned by setInterval.
    #clientSubscriptionMap = null; // The map that associates each existing client connection to an array of state names. 

    /*
     * This is the constructor of the class.
    */
    constructor(host, portNumber, libraryAdapter)
    {
        this.#host = host;
        this.#portNumber = portNumber;
        this.#libraryAdapter = libraryAdapter;
        this.#libraryStateSubscriptionManager = new WSLibrary.LibraryStateSubscriptionManager(this, this.#libraryAdapter);
        this.#clientSubscriptionMap = new Map();
    }

    /*
     * Method that starts the web socket server.
    */
    Start()
    {
        this.#InitialiseWebSocket();
    }

    /*
     * Method that stops the web socket server.
    */
    Stop()
    {
        this.#FinaliseWebSocket();
    }

    /* 
     * Method required by the "WebSocketNotifier" interface that LibraryStateSubscriptionManager requires as a construction parameter.
    */
    SendNotification(stateName, newValue)
    {
        this.#clientSubscriptionMap.forEach((subscribedStateNames, webSocketClient) => {
            // Verify that the client is open before shipping
            if (webSocketClient.readyState === WebSocket.OPEN && subscribedStateNames.includes(stateName))
                webSocketClient.send(JSON.stringify({ stateName, newValue }));
        });
    }

    /* 
     * Private method that updates the subscriptions.
    */
    async #Update() 
    {
        if (this.#libraryStateSubscriptionManager)
            await this.#libraryStateSubscriptionManager.Update();
    }

    /*
     *  Private method that initialises the web socket server.
    */
    #InitialiseWebSocket()
    {
        this.#FinaliseWebSocket(); // Just in case

        this.#webSocketServer = new WebSocket.Server({ 
            host: this.#host, 
            port: this.#portNumber 
        });

        this.#webSocketServer.on("connection", this.#InitialiseWebSocketClient.bind(this));
        
        const settings = WSLibrary.Settings.GetInstance();
        const updateInterval = settings.GetUpdateInterval();

        this.#updateIntervalId = setInterval(this.#Update.bind(this), updateInterval);
    }

    /*
     * Private method that finalises the web socket server.
    */
    #FinaliseWebSocket()
    {
        if (this.#updateIntervalId !== -1)
        {
            clearInterval(this.#updateIntervalId);
            this.#updateIntervalId = -1;
        }

        // Close active connections if necessary
        if (this.#webSocketServer)
            this.#webSocketServer.close();
        this.#webSocketServer = null;
    }

    /*
     * Private method that initialises a web socket client connection.
    */
    #InitialiseWebSocketClient(newWebSocketClient)
    {
        this.#clientSubscriptionMap.set(newWebSocketClient, []);

        newWebSocketClient.on("close", () => this.#FinaliseWebSocketClient(newWebSocketClient));
        newWebSocketClient.on("message", (message) => this.#HandleWebSocketClientMessage(newWebSocketClient, message));
        console.log('Client connected');
    }

    /*
     * Private method that finalises a web socket client connection.
    */
    #FinaliseWebSocketClient(webSocketClient)
    {
        this.#clientSubscriptionMap.delete(webSocketClient);
        console.log('Client disconnected');
    }

    /*
     * Private method that handles a subscribe/unsubscribe message from a web socket client.
    */
    #HandleWebSocketClientMessage(webSocketClient, message)
    {
        let parsed;
        try {
            // Attempt to parse the incoming message as JSON
            parsed = JSON.parse(message);
        } catch(e) {
            console.error("Error parsing message: ", e);
            return;
        }

        // Validate that message has the necessary properties
        const { action, stateName } = parsed;
        if (!action || !stateName) {
            console.warn("Received message is missing required fields: ", parsed);
            return;
        }

        if (action === "subscribe")
        {
            // Avoid duplicates
            const subscriptions = this.#clientSubscriptionMap.get(webSocketClient) || [];
            if (!subscriptions.includes(stateName))
            {
                subscriptions.push(stateName);
                this.#clientSubscriptionMap.set(webSocketClient, subscriptions);
                // Notify the subscription manager that a new state has been subscribed
                this.#libraryStateSubscriptionManager.AddSubscriber(stateName);
            }
        }
        else if (action === "unsubscribe")
        {
            const subscriptions = this.#clientSubscriptionMap.get(webSocketClient) || [];
            const index = subscriptions.indexOf(stateName);
            if (index > -1) {
                subscriptions.splice(index, 1);
                this.#clientSubscriptionMap.set(webSocketClient, subscriptions);
                // Notify the subscription manager that a state has been unsubscribed
                this.#libraryStateSubscriptionManager.RemoveSubscriber(stateName);
            }
        }
        else {
            // Log an unknown action for debugging purposes
            console.warn("Unknown action: ", action);
        }
    }

};