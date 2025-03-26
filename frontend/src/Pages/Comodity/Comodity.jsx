import React, { useEffect, useState } from 'react'
import "./Comodity.module.css"
import { BASE_URL } from '../../utils/constant';

const Comodity = () => {
    const [commodityData, setCommodityData] = useState({});
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const ws = new WebSocket(`ws://${BASE_URL}:8080`); 

        ws.onopen = () => {
            console.log("Connected to WebSocket server");
            setIsConnected(true);

            ws.send(
                JSON.stringify({
                    action: "subscribe",
                    symbols: ["GOLD/USD", "SILVER/USD"],
                })
            );
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            setCommodityData((prevData) => ({
                ...prevData,
                [data.symbol]: data,
            }));
        };

        ws.onclose = () => {
            console.log("Disconnected from WebSocket server");
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <div className="App">
            <h1>Real-Time Commodity Data</h1>
            <p>Connection Status: {isConnected ? "Connected" : "Disconnected"}</p>

            <div className="commodity-list">
                {Object.keys(commodityData).map((symbol) => (
                    <div key={symbol} className="commodity-item">
                        <h2>{symbol}</h2>
                        <p>Price: {commodityData[symbol].price}</p>
                        <p>Last Updated: {new Date(commodityData[symbol].timestamp * 1000).toLocaleTimeString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Comodity