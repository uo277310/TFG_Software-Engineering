/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API 
 *              to optimize client-server interaction by avoiding polling.
 * File: LibraryStateCache.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
*/

WSLibrary.LibraryStateCache = class {

    #libraryAdapter = null; // The object that manages the interaction with the external API.
    #stateName = ""; // The text identifier of the state that this cache object stores.
    #latestValue = null; // The latest retrieved value for the state.

    /*
     * This is the constructor of the class.
    */
    constructor(libraryAdapter, stateName) {
        this.#libraryAdapter = libraryAdapter;
        this.#stateName = stateName;

        this.UpdateValue();
    }

    /*
     * Method that updates the value, replacing the latest value and returning true if the value has changed.
    */
    async UpdateValue() {
        try {
            const currentStateValue = await this.#libraryAdapter.GetStateValue(this.#stateName);
            const valueChanged = (currentStateValue !== this.#latestValue);
            if (valueChanged) {
                this.#latestValue = currentStateValue;
            }
            return valueChanged;
        } catch (error) {
            console.error(`Error updating state value for ${this.#stateName}:`, error);
            return false;
        }
    }

    /*
     * Method that returns the latest value.
    */
    async GetLatestValue() {
        return this.#latestValue;
    }

};