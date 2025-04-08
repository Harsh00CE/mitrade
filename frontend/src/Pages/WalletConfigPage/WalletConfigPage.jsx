import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../../utils/constant";
import BackButton from "../../components/BackButton/BackButton";

const WalletConfigPage = () => {
    const { userId } = useParams();
    const [userWallet, setUserWallet] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedWallet, setEditedWallet] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const token = localStorage.getItem('adminToken');

    const fetchUserWallet = async () => {
        try {
            setIsLoading(true);
            console.log("Fetching wallet for user ID:", token, userId);
            if (!token) {
                setMessage({ text: "Please login to fetch wallet", type: "error" });
                return;
            }
            
            const response = await axios.get(`http://${BASE_URL}:3000/api/adminuserwallet/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Wallet data response:", response.data);
            
            setUserWallet(response.data.data);
            setEditedWallet(response.data.data);
        } catch (error) {
            showMessage("Failed to fetch wallet data", "error");
            console.error("Error fetching wallet:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing) {
            setEditedWallet(userWallet);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedWallet((prev) => ({
            ...prev,
            [name]: parseFloat(value) || 0,
        }));
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const response = await axios.put(
                `http://${BASE_URL}:3000/api/configwallet/${userId}`,
                editedWallet
            );
            setUserWallet(response.data.data);
            setIsEditing(false);
            showMessage("Wallet updated successfully!", "success");
        } catch (error) {
            showMessage("Failed to update wallet", "error");
            console.error("Error updating wallet:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserWallet();
    }, [userId]);

    if (!userWallet) {
        return (
            <div className="w-full min-h-screen bg-gray-900 text-white p-4 sm:p-6">
                <div className="mb-6 w-full ml-10">
                    <BackButton />
                </div>

                <div className="w-full min-h-screen bg-gray-900 text-white flex items-center justify-center">


                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-opacity-50"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-900 text-white p-4 sm:p-6">
            <div className="mb-6 w-full ml-10">
                <BackButton />
            </div>
            <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
                <h1 className="text-xl sm:text-2xl font-bold text-blue-500 mb-6 text-center sm:text-left">
                    Wallet Configuration - User: {userId}
                </h1>

                {message.text && (
                    <div
                        className={`p-3 rounded-md mb-4 text-sm font-medium ${message.type === "success"
                            ? "bg-green-900 text-green-400"
                            : "bg-red-900 text-red-400"
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <div className="space-y-5">
                    {Object.entries(userWallet)
                        .filter(([key]) =>
                            ["balance", "equity", "available", "margin", "marginLevel", "pl"].includes(key)
                        )
                        .map(([key, value]) => (
                            <div
                                key={key}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center"
                            >
                                <label className="text-gray-300 font-medium capitalize">
                                    {key.replace(/([A-Z])/g, " $1")}:
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name={key}
                                        value={editedWallet[key] || 0}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        className="sm:col-span-2 px-3 py-2 border border-gray-600 bg-gray-900 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                ) : (
                                    <span className="sm:col-span-2 px-3 py-2 bg-gray-700 rounded-md text-white">
                                        {typeof value === "number" ? value.toFixed(2) : value}
                                    </span>
                                )}
                            </div>
                        ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-4">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleEditToggle}
                                disabled={isLoading}
                                className="px-4 py-2 border border-gray-600 text-white rounded-md hover:bg-gray-700 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition disabled:opacity-50"
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleEditToggle}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition disabled:opacity-50"
                        >
                            Edit Wallet
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletConfigPage;
