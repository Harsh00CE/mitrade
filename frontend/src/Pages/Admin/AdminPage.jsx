import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import useWebSocket from "react-use-websocket";
import { BASE_URL } from "../../utils/constant";
import BackButton from "../../components/BackButton/BackButton";

const AdminPage = () => {
    const { symbol } = useParams();
    const [currentPrice, setCurrentPrice] = useState(null);
    const [pairInfo, setPairInfo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const [formData, setFormData] = useState({
        symbol: symbol || "",
        volumePerTrade: { min: "", max: "" },
        ContractSize: "",
        maxVolumeOfOpenPosition: "",
        CurrencyOfQuote: "USD",
        floatingSpread: "",
        OvernightFundingRateBuy: "",
        OvernightFundingRateSell: "",
        OvernightFundingRateTime: "",
        logo: "",
    });

    useEffect(() => {
        if (symbol) {
            fetchPairInfo();
        }
    }, [symbol]);

    const fetchPairInfo = async () => {
        try {
            const response = await axios.get(`http://${BASE_URL}:3000/api/pair-info?symbol=${symbol}`);
            if (response.data.success) {
                const data = response.data.data;
                setPairInfo(data);
                setFormData({
                    ...data,
                    volumePerTrade: data.volumePerTrade,
                });

                // Set logo preview from saved value
                if (data.logo) {
                    setLogoPreview(data.logo);
                }
            } else {
                console.log("Pair info not found for symbol:", symbol);
            }
        } catch (error) {
            console.error("Error fetching pair info:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Sync logo URL input with preview
        if (name === "logo") {
            setLogoPreview(value);
        }
    };

    const handleVolumeChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            volumePerTrade: { ...prev.volumePerTrade, [name]: value },
        }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                alert("Image size should be less than 5 MB.");
                return;
            }
    
            setFormData((prev) => ({
                ...prev,
                logo: file, // Save the File object directly
            }));
    
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = new FormData();
            data.append("symbol", formData.symbol);
            data.append("volumePerTrade[min]", formData.volumePerTrade.min);
            data.append("volumePerTrade[max]", formData.volumePerTrade.max);
            data.append("ContractSize", formData.ContractSize);
            data.append("maxVolumeOfOpenPosition", formData.maxVolumeOfOpenPosition);
            data.append("CurrencyOfQuote", formData.CurrencyOfQuote);
            data.append("floatingSpread", formData.floatingSpread);
            data.append("OvernightFundingRateBuy", formData.OvernightFundingRateBuy);
            data.append("OvernightFundingRateSell", formData.OvernightFundingRateSell);
            data.append("OvernightFundingRateTime", formData.OvernightFundingRateTime);

            // Only append logo file if user uploaded a new one
            if (formData.logo instanceof File) {
                data.append("logo", formData.logo);
            }

            const response = await axios.post(`http://${BASE_URL}:3000/api/admin`, data, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            if (response.data.success) {
                alert("Pair info added/updated successfully!");
                fetchPairInfo();
            } else {
                alert("Failed to add/update pair info: " + response.data.message);
            }
        } catch (error) {
            console.error("Error adding/updating pair info:", error);
            alert("An error occurred while adding/updating pair info.");
        }
    };


    const { sendMessage, lastMessage } = useWebSocket(`ws://${BASE_URL}:3001`, {
        onOpen: () => {
            sendMessage(JSON.stringify({ type: "subscribe", symbol }));
        },
        shouldReconnect: () => true,
        reconnectInterval: 3000,
        onError: (err) => console.error("WebSocket Error", err),
    });

    useEffect(() => {
        if (!lastMessage?.data || !symbol) return;

        try {
            const message = JSON.parse(lastMessage.data);
            if (message.type === "priceUpdate") {
                const { instrument, bid, ask } = message.data;
                if (instrument === symbol) {
                    const avgPrice = ((parseFloat(bid) + parseFloat(ask)) / 2).toFixed(2);
                    setCurrentPrice(avgPrice);
                }
            } else if (message.type === "allForexPrice" || message.type === "allCryptoPrice") {
                const instrumentData = message.data.find((item) => item.instrument === symbol);
                if (instrumentData) {
                    const avgPrice = ((parseFloat(instrumentData.bid) + parseFloat(instrumentData.ask)) / 2).toFixed(2);
                    setCurrentPrice(avgPrice);
                }
            }
        } catch (error) {
            console.error("Failed to process WebSocket message:", error);
        }
    }, [lastMessage, symbol]);

    return (
        <div className="min-h-screen bg-gray-900 text-white px-4 sm:px-6 lg:px-20 py-6">
            <div className="mb-6 w-full ml-10">
                <BackButton />
            </div>
            <div className="max-w-4xl mx-auto bg-gray-800 shadow-md rounded-lg p-6">
                <h1 className="text-xl sm:text-2xl font-bold mb-4">Admin Page - Pair Information</h1>

                {currentPrice && (
                    <div className="mb-4 text-base sm:text-lg font-semibold">
                        <strong>Current Price:</strong> ${currentPrice}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Logo URL */}
                    <div>
                        <label className="block font-medium">Logo URL:</label>
                        <input
                            type="text"
                            name="logo"
                            value={formData.logo}
                            onChange={handleChange}
                            placeholder="https://example.com/logo.png"
                            className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                        />
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="block font-medium">Upload Logo Image:</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                        />
                    </div>

                    {/* Logo Preview */}
                    {logoPreview && (
                        <div className="mb-4">
                            <label className="block font-medium">Logo Preview:</label>
                            <img
                                // src={logoPreview}
                                src={`http://${BASE_URL}:3000/${logoPreview.replace(/\\/g, '/')}`}
                                alt="Logo Preview"
                                className="w-16 h-16 object-contain border border-gray-600 rounded"
                            />
                        </div>
                    )}

                    {/* Volume Per Trade */}
                    <div>
                        <label className="block font-medium">Volume Per Trade:</label>
                        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                            <input
                                type="number"
                                name="min"
                                value={formData.volumePerTrade.min}
                                onChange={handleVolumeChange}
                                placeholder="Min"
                                required
                                className="w-full sm:w-1/2 px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                            />
                            <input
                                type="number"
                                name="max"
                                value={formData.volumePerTrade.max}
                                onChange={handleVolumeChange}
                                placeholder="Max"
                                required
                                className="w-full sm:w-1/2 px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                    </div>

                    {/* Other Fields */}
                    <div>
                        <label className="block font-medium">Max Volume of Open Positions:</label>
                        <input
                            type="number"
                            name="maxVolumeOfOpenPosition"
                            value={formData.maxVolumeOfOpenPosition}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                        />
                    </div>

                    <div>
                        <label className="block font-medium">Currency of Quote:</label>
                        <select
                            name="CurrencyOfQuote"
                            value={formData.CurrencyOfQuote}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="JPY">JPY</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium">Floating Spread:</label>
                        <input
                            type="number"
                            name="floatingSpread"
                            value={formData.floatingSpread}
                            onChange={handleChange}
                            step="0.01"
                            required
                            className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                        />
                    </div>

                    <div>
                        <label className="block font-medium">Contract Size:</label>
                        <input
                            type="number"
                            name="ContractSize"
                            value={formData.ContractSize}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                        />
                    </div>

                    <div>
                        <label className="block font-medium">Overnight Funding Rate (Buy):</label>
                        <input
                            type="number"
                            name="OvernightFundingRateBuy"
                            value={formData.OvernightFundingRateBuy}
                            onChange={handleChange}
                            step="0.0001"
                            required
                            className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                        />
                    </div>

                    <div>
                        <label className="block font-medium">Overnight Funding Rate (Sell):</label>
                        <input
                            type="number"
                            name="OvernightFundingRateSell"
                            value={formData.OvernightFundingRateSell}
                            onChange={handleChange}
                            step="0.0001"
                            required
                            className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                        />
                    </div>

                    <div>
                        <label className="block font-medium">Overnight Funding Rate Time:</label>
                        <input
                            type="time"
                            name="OvernightFundingRateTime"
                            value={formData.OvernightFundingRateTime}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        {pairInfo ? "Update Pair Info" : "Save Pair Info"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminPage;
