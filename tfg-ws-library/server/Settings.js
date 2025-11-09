/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API 
 *              to optimize client-server interaction by avoiding polling.
 * File: Settings.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
*/

const DEFAULT_UPDATE_INTERVAL = 5000; // Update interval in milliseconds

WSLibrary.Settings = class {

    #updateInterval = DEFAULT_UPDATE_INTERVAL; // The update interval to use when polling for state changes.
    static sInstance = null; // The only instance of the class.
    static sGettingInstance = false; // A Boolean flag to assert that the object is always constructed from within the GetInstance static method.

    /*
     * This is the constructor of the class.
    */
    constructor() {
        if (!WSLibrary.Settings.sGettingInstance)
            throw new Error("Invalid construction of Singleton class bypassing the static GetInstance method which must always be used");
    }

    /* 
     * This is the singleton's GetInstance method that provides access to the only object of this type.
    */
    static GetInstance() {
        if (WSLibrary.Settings.sInstance === null) {
            WSLibrary.Settings.sGettingInstance = true;
            WSLibrary.Settings.sInstance = new WSLibrary.Settings();
            WSLibrary.Settings.sGettingInstance = false;
        }
        return WSLibrary.Settings.sInstance;
    }

    /*
     * Accessor that sets the update interval.
    */
    SetUpdateInterval(updateInterval) {
        if (typeof updateInterval !== 'number' || updateInterval <= 0)
            throw new Error("El update interval debe ser un número positivo.");
        this.#updateInterval = updateInterval;
    }

    /*
     * Accessor that gets the update interval.
    */
    GetUpdateInterval() {
        return this.#updateInterval;
    }

};
