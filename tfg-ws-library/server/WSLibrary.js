/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API 
 *              to optimize client-server interaction by avoiding polling.
 * File: WSLibrary.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
*/

if (typeof globalThis.WSLibrary !== 'undefined')
    throw new Error("Unexpected error: WSLibrary namespace already defined");

const WSLibrary = {}; // This is a dummy empty object used as a namespace.
globalThis.WSLibrary = WSLibrary;