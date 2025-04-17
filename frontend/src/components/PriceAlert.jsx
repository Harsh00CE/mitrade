import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constant";

const PriceAlert = ({ userId }) => {
    const [symbol, setSymbol] = useState("BTCUSDT");
    const [alertPrice, setAlertPrice] = useState("");
    const [alertType, setAlertType] = useState("buy");
    const [alertOption, setAlertOption] = useState("onlyOnce");
    const [alerts, setAlerts] = useState([]);
    const [ws, setWs] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        axios.get(`http://${BASE_URL}:3000/api/alerts/${userId}`)
            .then(response => setAlerts(response.data.data))
            .catch(error => console.error("Error fetching alerts:", error));

        const socket = new WebSocket(`ws://${BASE_URL}:8080`);

        socket.onopen = () => {
            console.log("WebSocket connected");
            socket.send(JSON.stringify({ type: "subscribe", userId }));
        };

        socket.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data.type === "priceAlert") {
                setNotifications(prev => [...prev, data]);
            }
        };

        socket.onclose = () => console.log("WebSocket disconnected");

        setWs(socket);

        return () => socket.close();
    }, [userId]);

    const handleSetAlert = async () => {
        if (!alertPrice) {
            alert("Please enter a valid price!");
            return;
        }

        const payload = {
            userId,
            symbol,
            alertPrice: parseFloat(alertPrice),
            alertType,
            frequency:alertOption,
        };

        console.log("Payload being sent:", payload);

        try {
            const response = await axios.post(`http://${BASE_URL}:3000/api/alerts`, payload);
            setAlerts([...alerts, response.data.data]);
            alert("Alert created successfully!");
        } catch (error) {
            console.error("Error setting alert:", error);
            alert("Failed to set alert.");
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-xl font-bold mb-4">Set Crypto Price Alert</h2>

            {/* Select Token Symbol */}
            <div className="mb-4">
                <label className="block font-medium">Select Token:</label>
                <select 
                    value={symbol} 
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="BTCUSDT">BTC/USDT</option>
                    <option value="ETHUSDT">ETH/USDT</option>
                    <option value="BNBUSDT">BNB/USDT</option>
                </select>
            </div>

            {/* Input Price */}
            <div className="mb-4">
                <label className="block font-medium">Alert Price:</label>
                <input
                    type="number"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter price"
                />
            </div>

            {/* Alert Type (Buy/Sell) */}
            <div className="mb-4">
                <label className="block font-medium">Alert Type:</label>
                <select 
                    value={alertType} 
                    onChange={(e) => setAlertType(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                </select>
            </div>

            {/* Alert Frequency */}
            <div className="mb-4">
                <label className="block font-medium">Alert Frequency:</label>
                <select 
                    value={alertOption} 
                    onChange={(e) => setAlertOption(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="onlyOnce">Only Once</option>
                    <option value="onceADay">Once a Day</option>
                </select>
            </div>

            {/* Submit Button */}
            <button 
                onClick={handleSetAlert} 
                className="bg-blue-500 text-white px-4 py-2 rounded"
            >
                Set Alert
            </button>

            {/* Display Active Alerts */}
            <h3 className="text-lg font-bold mt-6">Your Alerts:</h3>
            <ul className="list-disc pl-5">
                {alerts.map((alert, index) => (
                    <li key={index} className="mt-2">
                        {alert.symbol} - {alert.alertType.toUpperCase()} @ ${alert.alertPrice} [{alert.alertOption}]
                    </li>
                ))}
            </ul>

            {/* WebSocket Notifications */}
            <h3 className="text-lg font-bold mt-6">Notifications:</h3>
            <ul className="list-disc pl-5">
                {notifications.map((notif, index) => (
                    <li key={index} className="mt-2 text-red-500">
                        {notif.symbol} reached ${notif.price}!
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PriceAlert;