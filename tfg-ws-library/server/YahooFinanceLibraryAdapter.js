/*
 * Author: Luis Miguel Gómez del Cueto
 * Contact: luismigmez@gmail.com
 * Final Degree Project – Software Engineering
 * University of Oviedo
 * Title: Real-Time Price Monitoring Using WebSockets
 * Description: This file is part of the final project that implements a WebSocket-based API 
 *              to optimize client-server interaction by avoiding polling.
 * File: YahooFinanceLibraryAdapter.js
 * Year: 2025
 * Version: 1.0
 * All rights reserved.
*/

Foo.YahooFinanceLibraryAdapter = class
{

    #yahooFinance = null; // The object that manages the interaction with the Yahoo API.

    /*
     * This is the constructor of the class.
    */
    constructor()
    {
        this.#yahooFinance = require('yahoo-finance2').default;
        this.#yahooFinance.suppressNotices(['yahooSurvey']);
    }

    /*
     * Method that returns the available state names, as required by the LibraryAdapter interface.
     * In this case, we return the Yahoo quotes as the valid state names.
    */
    GetStateNames()
    {
        return ["AAPL", "GOOGL", "TSLA", "AMZN", "MSFT", "NFLX", "BABA", "NVDA", "META", "INTC", 
            "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "XRP-USD", "DOGE-USD", "DOT-USD", "MATIC-USD", 
            "EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCAD=X", "AUDUSD=X", "NZDUSD=X", "USDCHF=X"];
    }

    /*
     * Method that returns the available state names, as required by the LibraryAdapter interface.
    */
    async GetStateValue(stateName)
    {
        if (!this.GetStateNames().includes(stateName))
            throw new Error("Invalid state name: " + stateName);

        // Save the original stdout/stderr write functions for restoration later.
        const originalStdoutWrite = process.stdout.write;
        const originalStderrWrite = process.stderr.write;
        try {
            // Temporarily disable stdout and stderr to avoid warnings from yahoo-finance2
            process.stdout.write = () => {};
            process.stderr.write = () => {};

            const result = await this.#yahooFinance.quote(stateName);
            const price = result.regularMarketPrice;
            
            return price;
        } catch (error) {
            console.error("Error fetching state value for", stateName, ":", error);
            throw error;
        } finally {
            // Ensure that stdout and stderr are always restored
            process.stdout.write = originalStdoutWrite;
            process.stderr.write = originalStderrWrite;
        }
    }

};