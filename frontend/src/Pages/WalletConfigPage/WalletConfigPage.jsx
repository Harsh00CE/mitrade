import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../../utils/constant";
import BackButton from "../../components/BackButton/BackButton";
import { loader } from "../../assets/imgs";

const WalletConfigPage = () => {
    const { userId } = useParams();
    const [userWallet, setUserWallet] = useState(null);
    const [userActiveWallet, setUserActiveWallet] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDemoWallet, setEditedDemoWallet] = useState({});
    const [editedActiveWallet, setEditedActiveWallet] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const token = localStorage.getItem('adminToken');

    const fetchUserWallet = async () => {
        try {
            setIsLoading(true);

            if (!token) {
                setMessage({ text: "Please login to fetch wallet", type: "error" });
                return;
            }

            const response = await axios.get(`http://${BASE_URL}:3000/api/adminuserwallet/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const activeWalletResponse = await axios.get(`http://${BASE_URL}:3000/api/get-active-wallet/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setUserWallet(response.data.data);
                setEditedDemoWallet(response.data.data);
            } else {
                setUserWallet(null);
            }

            if (activeWalletResponse.data.success) {
                setUserActiveWallet(activeWalletResponse.data.data);
                setEditedActiveWallet(activeWalletResponse.data.data);
            } else {
                setUserActiveWallet(null);
            }
        } catch (error) {
            showMessage("Error fetching wallet data", "error");
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
        if (!isEditing) {
            if (userWallet) setEditedDemoWallet(userWallet);
            if (userActiveWallet) setEditedActiveWallet(userActiveWallet);
        }
    };

    const handleInputChange = (e, walletType) => {
        const { name, value } = e.target;
        const parsedValue = parseFloat(value);

        if (walletType === "demo") {
            setEditedDemoWallet(prev => ({ ...prev, [name]: parsedValue }));
        } else if (walletType === "active") {
            setEditedActiveWallet(prev => ({ ...prev, [name]: parsedValue }));
        }
    };

    const saveDemoWallet = async () => {
        try {
            setIsLoading(true);
            const response = await axios.put(
                `http://${BASE_URL}:3000/api/configwallet/${userId}`,
                editedDemoWallet,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!response.data.success) {
                showMessage("Failed to update demo wallet", "error");
                return;
            }
            setUserWallet(response.data.data);
            showMessage("Demo wallet updated successfully!", "success");
            setIsEditing(false);
        } catch (error) {
            showMessage("Demo wallet update failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const saveActiveWallet = async () => {
        try {
            setIsLoading(true);
            const response = await axios.put(
                `http://${BASE_URL}:3000/api/get-active-wallet/${userId}`,
                editedActiveWallet,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.data.success) {
                showMessage("Failed to update active wallet", "error");
                return;
            }
            setUserActiveWallet(response.data.data);
            showMessage("Active wallet updated successfully!", "success");
            setIsEditing(false);
        } catch (error) {
            showMessage("Active wallet update failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserWallet();
    }, [userId]);

    if (!userWallet && !userActiveWallet) {
        return (
            <div className="w-full min-h-screen bg-gray-900 text-white p-4">
                <div className="mb-6 w-full ml-10">
                    <BackButton />
                </div>
                <div className="flex justify-center items-center min-h-screen">
                    <img src={loader} height={100} width={100} alt="" /> 
                </div>
            </div>
        );
    }

    const renderWalletFields = (walletData, type) => (
        Object.entries(walletData)
            .filter(([key]) => ["balance", "equity", "available", "margin", "marginLevel", "leverage", "pl"].includes(key))
            .map(([key, value]) => (
                <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5 sm:gap-4 items-center">
                    <label className="text-gray-300 font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1")}:
                    </label>
                    {isEditing ? (
                        <input
                            type="number"
                            name={key}
                            value={value}
                            onChange={(e) => handleInputChange(e, type)}
                            className="sm:col-span-2 px-3 py-2 border border-gray-600 bg-gray-900 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    ) : (
                        <span className="sm:col-span-2 px-3 py-2 bg-gray-700 rounded-md text-white">
                            {typeof value === "number" ? value.toFixed(2) : value}
                        </span>
                    )}
                </div>
            ))
    );

    return (
        <div className="w-full min-h-screen bg-gray-900 text-white p-4 sm:p-6">
            <div className="mb-6 w-full ml-10">
                <BackButton />
            </div>
            <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-blue-500 mb-6 text-center sm:text-left">
                    Wallet Configuration - User: {userId}
                </h1>

                {message.text && (
                    <div className={`p-3 rounded-md mb-4 text-sm font-medium ${message.type === "success" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                        {message.text}
                    </div>
                )}

                {/* Demo Wallet */}
                <div className="m-5 border-2 border-gray-600 rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">Demo Wallet</h2>
                    {userWallet ? (
                        <>
                            {renderWalletFields(editedDemoWallet, "demo")}
                            {isEditing && (
                                <div className="mt-6 flex justify-end gap-4">
                                    <button onClick={saveDemoWallet} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50">
                                        {isLoading ? "Saving..." : "Save Demo Wallet"}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-red-400">Demo Wallet not found for this user.</p>
                    )}
                </div>

                {/* Active Wallet */}
                <div className="m-5 border-2 border-gray-600 rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">Active Wallet</h2>
                    {userActiveWallet ? (
                        <>
                            {renderWalletFields(editedActiveWallet, "active")}
                            {isEditing && (
                                <div className="mt-6 flex justify-end gap-4">
                                    <button onClick={saveActiveWallet} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50">
                                        {isLoading ? "Saving..." : "Save Active Wallet"}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-red-400">Active Wallet not found for this user.</p>
                    )}
                </div>

                {/* Toggle Edit Mode */}
                {(userWallet || userActiveWallet) && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleEditToggle}
                            disabled={isLoading}
                            className="px-6 py-2 mt-4 bg-blue-700 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-50"
                        >
                            {isEditing ? "Cancel Edit" : "Edit Wallets"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletConfigPage;
