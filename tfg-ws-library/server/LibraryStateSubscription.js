/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API 
 *              to optimize client-server interaction by avoiding polling.
 * File: LibraryStateSubscription.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
*/

WSLibrary.LibraryStateSubscription = class
{

    #libraryAdapter = null; // The object that manages the interaction with the external API.
    #stateName = ""; // The text identifier of the state that this cache object stores.
    #libraryStateCache = null; // The object that manages the cached value for the managed state.
    #numberOfSubscribers = 0; // The number of current subscribers.

    /*
     * This is the constructor of the class.
    */
    constructor(libraryAdapter, stateName)
    {
        this.#libraryAdapter = libraryAdapter;
        this.#stateName = stateName;
    }

    /*
     * Method that updates the cached value if there are any subscribers.
     * It returns true if there has been a change in value and the web socket clients must be notified.
    */
    async Update()
    {
        let valueChanged = false;

        if (this.#numberOfSubscribers > 0)
            valueChanged = await this.#libraryStateCache.UpdateValue();

        return valueChanged;
    }

    /*
     * Method that returns the latest value.
    */
    async GetLatestValue()
    {
        let latestValue = null;
        if (this.#numberOfSubscribers > 0 && this.#libraryStateCache)
            latestValue = await this.#libraryStateCache.GetLatestValue();

        return latestValue;
    }

    /*
     * Method that adds a subscriber.
    */
    AddSubscriber()
    {
        if (this.#numberOfSubscribers === 0)
            this.#libraryStateCache = new WSLibrary.LibraryStateCache(this.#libraryAdapter, this.#stateName);

        ++this.#numberOfSubscribers;
    }

    /*
     * Method that removes a subscriber.
    */
    RemoveSubscriber()
    {
        if (this.#numberOfSubscribers > 0) {
            --this.#numberOfSubscribers;
            if (this.#numberOfSubscribers === 0)
                this.#libraryStateCache = null;
        } else {
            console.warn(`There are no subscribers to remove in the ${this.#stateName} state`);
        }
    }

};