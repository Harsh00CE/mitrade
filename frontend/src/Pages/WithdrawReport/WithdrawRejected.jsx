// src/pages/WithdrawRejected.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/constant';
import BackButton from '../../components/BackButton/BackButton';

const WithdrawRejected = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(null);
  const [editedReason, setEditedReason] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

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

  const handleEdit = (withdrawal) => {
    setEditMode(withdrawal._id);
    setEditedReason(withdrawal.reason || '');
  };

  const handleSave = async (id) => {
    try {
      const res = await axios.post(`http://${BASE_URL}:3000/api/withdraw/reject`, {
        withdrawId: id,
        reason: editedReason,
      });

      setMessage(res.data.message);
      setMessageType(res.data.success ? 'success' : 'error');

      // Update the reason locally without fetching again
      setWithdrawals((prev) =>
        prev.map((w) =>
          w._id === id ? { ...w, reason: editedReason } : w
        )
      );
    } catch (err) {
      console.error('Error updating reason:', err);
      setMessage('Failed to update reason');
      setMessageType('error');
    }
  };


  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="flex ml-10 items-center mb-4">
        <BackButton />
      </div>
      <h2 className="text-2xl font-bold mb-4">Rejected Withdrawals</h2>

      {message && (
        <div className={`p-4 mb-4 rounded ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {message}
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
                <th className="text-left py-2 px-4 border-b">Status</th>
                <th className="text-left py-2 px-4 border-b">Reject Reason</th>
                <th className="text-left py-2 px-4 border-b">Created At</th>
                <th className="text-left py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal._id}>
                  <td className="py-2 px-4 border-b">{withdrawal.userId}</td>
                  <td className="py-2 px-4 border-b">{withdrawal.amount}</td>
                  <td className="py-2 px-4 border-b capitalize">{withdrawal.status}</td>
                  <td className="py-2 px-4 border-b">
                    {editMode === withdrawal._id ? (
                      <textarea
                        className="w-full p-1 text-white rounded"
                        value={editedReason}
                        onChange={(e) => setEditedReason(e.target.value)}
                      />
                    ) : (
                      <span className="text-white italic">
                        {withdrawal.reason || 'N/A'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {new Date(withdrawal.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {editMode === withdrawal._id ? (
                      <>
                        <button
                          onClick={() => handleSave(withdrawal._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditMode(null)}
                          className="bg-gray-600 text-white px-3 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEdit(withdrawal)}
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                    )}
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
