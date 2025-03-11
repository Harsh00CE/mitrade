import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import useWebSocket from "react-use-websocket";

const AdminPage = () => {
    const { symbol } = useParams();
    const [currentPrice, setCurrentPrice] = useState(null);
    const [pairInfo, setPairInfo] = useState(null);

    const [formData, setFormData] = useState({
        symbol: symbol || "",
        volumePerTrade: { min: "", max: "" }, // Updated to an object with min and max
        leverages: "", // Comma-separated string for user input
        ContractSize: "",
        maxVolumeOfOpenPosition: "",
        CurrencyOfQuote: "USD",
        floatingSpread: "",
        OvernightFundingRateBuy: "",
        OvernightFundingRateSell: "",
        OvernightFundingRateTime: "",
    });

    // Fetch pair info for the symbol when the component mounts
    useEffect(() => {
        if (symbol) {
            fetchPairInfo();
        }
    }, [symbol]);

    // Fetch pair info from the backend
    const fetchPairInfo = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/pair-info?symbol=${symbol}`);
            if (response.data.success) {
                setPairInfo(response.data.data);
                // Pre-fill the form with existing data
                setFormData({
                    ...response.data.data,
                    volumePerTrade: response.data.data.volumePerTrade, // Already an object
                    leverages: response.data.data.leverages.join(","), // Convert array to comma-separated string
                });
            } else {
                console.log("Pair info not found for symbol:", symbol);
            }
        } catch (error) {
            console.error("Error fetching pair info:", error);
        }
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Handle changes for volumePerTrade (min and max)
    const handleVolumePerTradeChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            volumePerTrade: {
                ...formData.volumePerTrade,
                [name]: value,
            },
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Convert leverages from comma-separated string to array
        const leveragesArray = formData.leverages
            .split(",")
            .map((lev) => parseFloat(lev.trim()))
            .filter((lev) => !isNaN(lev));

        try {
            const response = await axios.post("http://localhost:3000/api/admin", {
                ...formData,
                leverages: leveragesArray, // Send leverages as an array
            });

            if (response.data.success) {
                alert("Pair info added/updated successfully!");
                fetchPairInfo(); // Refresh the pair info
            } else {
                alert("Failed to add/update pair info.");
            }
        } catch (error) {
            console.error("Error adding/updating pair info:", error);
            alert("An error occurred while adding/updating pair info.");
        }
    };

    // WebSocket for real-time price updates
    const { lastMessage } = useWebSocket(
        `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`
    );

    useEffect(() => {
        if (lastMessage) {
            const tradeData = JSON.parse(lastMessage.data);
            const newPrice = parseFloat(tradeData.p).toFixed(2);
            setCurrentPrice(newPrice);
        }
    }, [lastMessage]);

    return (
        <div style={styles.container}>
            <h1>Admin Page - Pair Information</h1>
            {currentPrice && (
                <div style={styles.priceDisplay}>
                    <strong>Current Price:</strong> ${currentPrice}
                </div>
            )}
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                    <label>Symbol:</label>
                    <input
                        type="text"
                        name="symbol"
                        value={formData.symbol}
                        onChange={handleChange}
                        required
                        disabled={!!symbol} // Disable if symbol is pre-filled from URL
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Volume Per Trade (Min):</label>
                    <input
                        type="number"
                        name="min"
                        value={formData.volumePerTrade.min}
                        onChange={handleVolumePerTradeChange}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Volume Per Trade (Max):</label>
                    <input
                        type="number"
                        name="max"
                        value={formData.volumePerTrade.max}
                        onChange={handleVolumePerTradeChange}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Leverages (comma-separated):</label>
                    <input
                        type="text"
                        name="leverages"
                        value={formData.leverages}
                        onChange={handleChange}
                        required
                        placeholder="e.g., 10, 20, 30"
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Contract Size:</label>
                    <input
                        type="number"
                        name="ContractSize"
                        value={formData.ContractSize}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Max Volume of Open Positions:</label>
                    <input
                        type="number"
                        name="maxVolumeOfOpenPosition"
                        value={formData.maxVolumeOfOpenPosition}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Currency of Quote:</label>
                    <select
                        name="CurrencyOfQuote"
                        value={formData.CurrencyOfQuote}
                        onChange={handleChange}
                        required
                    >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                    </select>
                </div>

                <div style={styles.formGroup}>
                    <label>Floating Spread:</label>
                    <input
                        type="number"
                        name="floatingSpread"
                        value={formData.floatingSpread}
                        onChange={handleChange}
                        step="0.01"
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Overnight Funding Rate (Buy):</label>
                    <input
                        type="number"
                        name="OvernightFundingRateBuy"
                        value={formData.OvernightFundingRateBuy}
                        onChange={handleChange}
                        step="0.0001"
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Overnight Funding Rate (Sell):</label>
                    <input
                        type="number"
                        name="OvernightFundingRateSell"
                        value={formData.OvernightFundingRateSell}
                        onChange={handleChange}
                        step="0.0001"
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Overnight Funding Rate Time:</label>
                    <input
                        type="time"
                        name="OvernightFundingRateTime"
                        value={formData.OvernightFundingRateTime}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" style={styles.submitButton}>
                    {pairInfo ? "Update Pair Info" : "Save Pair Info"}
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
    },
    priceDisplay: {
        marginBottom: "20px",
        fontSize: "1.2em",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
    },
    submitButton: {
        padding: "10px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
};

export default AdminPage;