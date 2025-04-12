// src/pages/WithdrawRejected.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/constant';
import BackButton from '../../components/BackButton/BackButton';

const WithdrawRejected = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get(`http://${BASE_URL}:3000/api/withdraw/all`);
      setWithdrawals(res.data.data.filter((item) => item.status === 'rejected'));
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="flex ml-10 items-center mb-4">
        <BackButton />
      </div>
      <h2 className="text-2xl font-bold mb-4">Rejected Withdrawals</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 text-white border border-gray-700 shadow-md">
            <thead className="bg-blue-600">
              <tr>
                <th className="text-left py-2 px-4 border-b">User ID</th>
                <th className="text-left py-2 px-4 border-b">Amount</th>
                <th className="text-left py-2 px-4 border-b">Status</th>
                <th className="text-left py-2 px-4 border-b">Created At</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal._id}>
                  <td className="py-2 px-4 border-b">{withdrawal.userId}</td>
                  <td className="py-2 px-4 border-b">{withdrawal.amount}</td>
                  <td className="py-2 px-4 border-b capitalize">{withdrawal.status}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(withdrawal.createdAt).toLocaleString()}
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

export default WithdrawRejected;
