/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API 
 *              to optimize client-server interaction by avoiding polling.
 * File: LibraryStateSubscriptionManager.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
*/

WSLibrary.LibraryStateSubscriptionManager = class {

    #webSocketNotifier = null; // The object that knows how to send notifications to the web socket clients.
    #libraryAdapter = null; // The object that manages the interaction with the external API.
    #libraryStateSubscriptions = new Map(); // The associative map of state identifiers and objects that support the subscriptions for each individual state. 
    #libraryStateSubscriptionIterator = null; // Object that will handle the update logic of the iteration over states and subscribers

    /*
     * This is the constructor of the class.
    */
    constructor(webSocketNotifier, libraryAdapter) {
        this.#webSocketNotifier = webSocketNotifier;
        this.#libraryAdapter = libraryAdapter;

        const stateNames = this.#libraryAdapter.GetStateNames();

        for (const stateName of stateNames)
            this.#libraryStateSubscriptions.set(stateName, new WSLibrary.LibraryStateSubscription(this.#libraryAdapter, stateName));

        this.#libraryStateSubscriptionIterator = new WSLibrary.LibraryStateSubscriptionIterator(this.#webSocketNotifier, this.#libraryStateSubscriptions);
    }

    /*
     * Method that updates all the values checking for changes and notifying the web socket clients when a change is detected.
    */
    async Update() {
        if (this.#libraryStateSubscriptionIterator.IsDone())
            this.#libraryStateSubscriptionIterator.Reset();
        this.#libraryStateSubscriptionIterator.Next();
    }

    /*
     * Method that adds a subscriber for a particular supported state.
    */
    AddSubscriber(stateName) {
        const libraryStateSubscription = this.#libraryStateSubscriptions.get(stateName);

        if (libraryStateSubscription)
            libraryStateSubscription.AddSubscriber();
        else
            throw new Error("Unknown state name in LibraryStateSubscriptionManager.AddSubscriber");
    }

    /*
     * Method that removes a subscriber.
    */
    RemoveSubscriber(stateName) {
        const libraryStateSubscription = this.#libraryStateSubscriptions.get(stateName);

        if (libraryStateSubscription)
            libraryStateSubscription.RemoveSubscriber();
        else
            throw new Error("Unknown state name in LibraryStateSubscriptionManager.RemoveSubscriber");
    }

};