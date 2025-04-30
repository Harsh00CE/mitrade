// src/pages/AdminBankForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../utils/constant";
import BackButton from "../../components/BackButton/BackButton";

const AdminBankForm = () => {
    const [formData, setFormData] = useState({
        accountNumber: "",
        holderName: "",
        IFSCcode: "",
        bankName: "",
        usdtAddress: "",
        usdtType: "",
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [qrImagePreview, setQrImagePreview] = useState(null);
    const [qrFile, setQrFile] = useState(null);


    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`http://${BASE_URL}:3000/api/admin-account-details`);
                if (res.data.success && res.data.data) {
                    setFormData(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch admin bank details", error);
                setMessage("Failed to load admin bank details.");
            } finally {
                setFetching(false);
            }
        };

        fetchDetails();
    }, []);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setQrFile(file);
        setQrImagePreview(URL.createObjectURL(file));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const form = new FormData();
            for (let key in formData) form.append(key, formData[key]);
            if (qrFile) form.append("qrCodeImage", qrFile);

            const res = await axios.post(`http://${BASE_URL}:3000/api/admin-account-details`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                setMessage("Admin bank details updated successfully.");
            } else {
                setMessage(res.data.message || "Failed to save details.");
            }
        } catch (err) {
            console.error(err);
            setMessage("Error submitting form.");
        } finally {
            setLoading(false);
        }
    };


    if (fetching) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-900 text-white overflow-y-scroll overflow-x-hidden">
            <div className="w-full ml-10">
                <BackButton />
            </div>
            <div className="max-w-lg mx-auto bg-gray-800 p-6 mt-10 shadow-lg border-gray-700 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">Set Admin Bank Details</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="mt-4 mb-0">Account Number:</p>
                    <input
                        type="text"
                        name="accountNumber"
                        placeholder="Account Number"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <p className="mt-4 mb-0 ">Holder Name:</p>
                    <input
                        type="text"
                        name="holderName"
                        placeholder="Holder Name"
                        value={formData.holderName}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <p className="mt-4 mb-0">IFSC Code:</p>
                    <input
                        type="text"
                        name="IFSCcode"
                        placeholder="IFSC Code"
                        value={formData.IFSCcode}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <p className="mt-4 mb-0">Bank Name:</p>
                    <input
                        type="text"
                        name="bankName"
                        placeholder="Bank Name"
                        value={formData.bankName}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <p className="mt-4 mb-0">USDT Address:</p>
                    <input
                        type="text"
                        name="usdtAddress"
                        placeholder="USDT Address"
                        value={formData.usdtAddress}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <p className="mt-4 mb-0">USDT Type:</p>
                    <input
                        type="text"
                        name="usdtType"
                        placeholder="USDT Type"
                        value={formData.usdtType}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />


                    <p className="mt-4 mb-0">Upload QR Code:</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full p-2 border rounded"
                    />

                    {qrImagePreview && (
                        <img
                            src={qrImagePreview}
                            alt="QR Code Preview"
                            className="w-40 h-40 object-contain mt-4 mx-auto border border-gray-500 rounded"
                        />
                    )}

                    {/* Show existing QR code from backend */}
                    {!qrImagePreview && formData.qrCodeImage && (
                        <img
                            src={`http://${BASE_URL}:3000/uploads/qrcodes/${formData.qrCodeImage}`}
                            alt="Current QR"
                            className="w-40 h-40 object-contain mt-4 mx-auto border border-gray-500 rounded"
                        />
                    )}



                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        {loading ? "Submitting..." : "Save Details"}
                    </button>




                </form>

                {message && (
                    <p className="mt-4 text-center text-sm text-green-400">{message}</p>
                )}
            </div>
        </div>
    );
};

export default AdminBankForm;
