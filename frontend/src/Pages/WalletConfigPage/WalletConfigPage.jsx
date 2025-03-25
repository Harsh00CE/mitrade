import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const WalletConfigPage = () => {
    const { userId } = useParams();
    const [userWallet, setUserWallet] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedWallet, setEditedWallet] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchUserWallet = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`http://localhost:3000/api/userwallet/${userId}`);
            setUserWallet(response.data.data);
            setEditedWallet(response.data.data);
        } catch (error) {
            showMessage('Failed to fetch wallet data', 'error');
            console.error("Error fetching wallet:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing) {
            setEditedWallet(userWallet);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedWallet(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const response = await axios.put(
                `http://localhost:3000/api/configwallet/${userId}`,
                editedWallet
            );
            setUserWallet(response.data.data);
            setIsEditing(false);
            showMessage('Wallet updated successfully!', 'success');
        } catch (error) {
            showMessage('Failed to update wallet', 'error');
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
            <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-600 px-6 py-4">
                    <h1 className="text-2xl font-bold text-white">
                        Wallet Configuration for User: {userId}
                    </h1>
                </div>

                {message.text && (
                    <div className={`p-3 mx-6 mt-4 rounded-md ${
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="p-6">
                    <div className="space-y-4">
                        {Object.entries(userWallet).filter(([key]) => 
                            ['balance', 'equity', 'available', 'margin', 'marginLevel', 'pl'].includes(key)
                        ).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <label className="text-gray-700 font-medium capitalize">
                                    {key.replace(/([A-Z])/g, ' $1')}:
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name={key}
                                        value={editedWallet[key] || 0}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                ) : (
                                    <span className="col-span-2 px-3 py-2 bg-gray-50 rounded-md">
                                        {typeof value === 'number' ? value.toFixed(2) : value}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end space-x-4">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleEditToggle}
                                    disabled={isLoading}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleEditToggle}
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                Edit Wallet
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletConfigPage;