/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API 
 *              to optimize client-server interaction by avoiding polling.
 * File: LibraryStateSubscriptionIterator.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
*/
WSLibrary.LibraryStateSubscriptionIterator = class {

    #webSocketNotifier = null; // The object that knows how to send notifications to the web socket clients. 
    #libraryStateSubscriptions = null; // The map to iterate over
    #states = []; // An array that stores a cached copy of the keys in the map above (assumed to be constant while this iterator object is being used)
    #currentIndex = 0; // The current iteration index

    constructor(webSocketNotifier, libraryStateSubscriptions) {
        // Parameter validation
        if (typeof webSocketNotifier !== 'object' || webSocketNotifier === null)
            throw new TypeError("webSocketNotifier must be a non-null object that implements SendNotification(stateName, newValue)");

        if (typeof webSocketNotifier.SendNotification !== 'function')
            throw new TypeError("webSocketNotifier must implement a SendNotification(stateName, newValue) method");

        if (!(libraryStateSubscriptions instanceof Map))
            throw new TypeError("libraryStateSubscriptions must be a Map instance");

        if (libraryStateSubscriptions.size === 0)
            throw new Error("libraryStateSubscriptions must be a non-empty Map");

        this.#webSocketNotifier = webSocketNotifier;
        this.#libraryStateSubscriptions = libraryStateSubscriptions;
        this.#states = Array.from(this.#libraryStateSubscriptions.keys());
        this.#currentIndex = 0;
    }

    Next() {
        const kMaximumNumberOfIterations = 100;
        const maximumIndex = this.#currentIndex + kMaximumNumberOfIterations;
        for (let index = this.#currentIndex; this.#currentIndex < this.#states.length && index < maximumIndex; ++index) {
            this.#UpdateState(index);
            ++this.#currentIndex;
        }
    }

    IsDone() {
        return this.#currentIndex === this.#states.length;
    }

    Reset() {
        this.#currentIndex = 0;
    }

    async #UpdateState(index) {
        const stateName = this.#states[index];
        const libraryStateSubscription = this.#libraryStateSubscriptions.get(stateName);

        try {
            // Await the async Update() result so we only notify when the value actually changed.
            const changed = await libraryStateSubscription.Update();
            if (changed) {
                const latestValue = await libraryStateSubscription.GetLatestValue();
                this.#webSocketNotifier.SendNotification(stateName, latestValue);
            }
        } catch (error) {
            console.error(`Error updating the ${stateName} state:`, error);
        }
    }

};