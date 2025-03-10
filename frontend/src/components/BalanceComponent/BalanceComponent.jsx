

import React, { useState, useEffect } from "react";

const BalanceComponent = ({ userId }) => {
    const [availableBalance, setAvailableBalance] = useState(0);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");

        ws.onopen = () => {
            console.log("WebSocket connection established");
            ws.send(JSON.stringify({ type: "subscribe", userId }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "availableBalance") {
               setAvailableBalance(message.data);
            }
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed");
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

       return () => {
            ws.close();
        };
    }, [userId]);

    return (
        <div>
            <h2>Available Balance: {availableBalance}</h2>
        </div>
    );
};

export default BalanceComponent;