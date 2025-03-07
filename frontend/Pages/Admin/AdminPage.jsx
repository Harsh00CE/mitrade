import React, { useState } from "react";
import axios from "axios";

const AdminPage = () => {
    const [formData, setFormData] = useState({
        symbol: "",
        volumePerTrade: "",
        maxLeverage: "",
        ContractSize: "",
        maxVolumeOfOpenPosition: "",
        CurrencyOfQuote: "USD",
        floatingSpread: "",
        OvernightFundingRateBuy: "",
        OvernightFundingRateSell: "",
        OvernightFundingRateTime: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Send form data to the backend API
            const response = await axios.post("/api/pair-info", formData);
            console.log("Response:", response.data);

            if (response.data.success) {
                alert("Pair info added successfully!");
            } else {
                alert("Failed to add pair info.");
            }
        } catch (error) {
            console.error("Error adding pair info:", error);
            alert("An error occurred while adding pair info.");
        }
    };

    return (
        <div style={styles.container}>
            <h1>Admin Page - Pair Information</h1>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                    <label>Symbol:</label>
                    <input
                        type="text"
                        name="symbol"
                        value={formData.symbol}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Volume Per Trade:</label>
                    <input
                        type="number"
                        name="volumePerTrade"
                        value={formData.volumePerTrade}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label>Maximum Leverage:</label>
                    <input
                        type="number"
                        name="maxLeverage"
                        value={formData.maxLeverage}
                        onChange={handleChange}
                        required
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
                    Save Pair Info
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