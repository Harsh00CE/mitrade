import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/constant';
import BackButton from '../../components/BackButton/BackButton';

const WithdrawReport = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // success or error

    // Fetch withdrawal data
    const fetchWithdrawals = async () => {
        try {
            const res = await axios.get(`http://${BASE_URL}:3000/api/withdraw/all`);
            // Filter only pending withdrawals
            const pendingWithdrawals = res.data.data.filter((withdrawal) => withdrawal.status === 'pending');
            setWithdrawals(pendingWithdrawals);
        } catch (err) {
            console.error('Error fetching withdrawals:', err);
            setMessage('Error fetching withdrawal data');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    // Handle approve action
    const handleApprove = async (id) => {
        try {
            const response = await axios.post(`http://${BASE_URL}:3000/api/withdraw/approve/${id}`);
            if (response.data.success) {
                setMessage('Withdrawal approved successfully');
                setMessageType('success');
            }else{
                setMessage(response.data.message);
                setMessageType('error');
            }
            fetchWithdrawals(); // Refresh the list after approving
        } catch (err) {
            console.error('Error approving withdrawal:', err);
            setMessage('Error approving withdrawal');
            setMessageType('error');
        }
    };

    // Handle reject action
    const handleReject = async (id) => {
        try {
            const response = await axios.post(`http://${BASE_URL}:3000/api/withdraw/reject/${id}`);
            if (response.data.success) {
                setMessage('Withdrawal rejected successfully');
                setMessageType('success');
            }else{
                setMessage(response.data.message);
                setMessageType('error');
            }
            fetchWithdrawals(); // Refresh the list after rejecting
        } catch (err) {
            console.error('Error rejecting withdrawal:', err);
            setMessage('Error rejecting withdrawal');
            setMessageType('error');
        }
    };

    return (
        <div className="p-6 bg-gray-900 text-white min-h-screen">
            <div className="flex ml-10 items-center mb-4">
                <BackButton />
            </div>
            <h2 className="text-2xl font-bold mb-4">Pending Withdrawals</h2>

            {message && (
                <div
                    className={`p-4 mb-4 rounded ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
                >
                    <p>{message}</p>
                </div>
            )}

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-800 text-white border border-gray-700 shadow-md">
                        <thead className="bg-blue-600">
                            <tr>
                                <th className="text-left py-2 px-4 border-b">User ID</th>
                                <th className="text-left py-2 px-4 border-b">Amount</th>
                                <th className="text-left py-2 px-4 border-b">Amount Type</th>
                                <th className="text-left py-2 px-4 border-b">Holder Name</th>
                                <th className="text-left py-2 px-4 border-b">Bank Name</th>
                                <th className="text-left py-2 px-4 border-b">Account Number</th>
                                <th className="text-left py-2 px-4 border-b">IFSC Code</th>
                                <th className="text-left py-2 px-4 border-b">Created At</th>
                                <th className="text-left py-2 px-4 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.map((withdrawal) => (
                                <tr key={withdrawal._id}>
                                    <td className="py-2 px-4 border-b">{withdrawal.userId}</td>
                                    <td className="py-2 px-4 border-b">{withdrawal.amount}</td>
                                    <td className="py-2 px-4 border-b">{withdrawal.amountType}</td>
                                    <td className="py-2 px-4 border-b">{withdrawal.holderName}</td>
                                    <td className="py-2 px-4 border-b">{withdrawal.bankName}</td>
                                    <td className="py-2 px-4 border-b">{withdrawal.accountNumber}</td>
                                    <td className="py-2 px-4 border-b">{withdrawal.IFSCcode}</td>
                                    <td className="py-2 px-4 border-b">
                                        {new Date(withdrawal.createdAt).toLocaleString()}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        <button
                                            className="bg-green-600 text-white py-1 w-full m-2 px-4 rounded"
                                            onClick={() => handleApprove(withdrawal._id)}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="bg-red-600 text-white py-1 w-full m-2 px-4 rounded"
                                            onClick={() => handleReject(withdrawal._id)}
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WithdrawReport;
