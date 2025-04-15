// src/pages/RejectedDeposits.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/constant';
import BackButton from '../../components/BackButton/BackButton';

const RejectedDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(null);
  const [editedReason, setEditedReason] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchDeposits = async () => {
    try {
      const res = await axios.get(`http://${BASE_URL}:3000/api/deposit/all`);
      setDeposits(res.data.data.filter((d) => d.status === 'rejected'));
    } catch (err) {
      console.error('Error fetching deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleEdit = (deposit) => {
    setEditMode(deposit._id);
    setEditedReason(deposit.reason || '');
  };

  const handleSave = async (id) => {
    try {
      const res = await axios.post(`http://${BASE_URL}:3000/api/deposit/reject`, {
        depositId: id,
        reason: editedReason,
      });

      setMessage(res.data.message);
      setMessageType(res.data.success ? 'success' : 'error');

      setDeposits((prev) =>
        prev.map((d) => (d._id === id ? { ...d, reason: editedReason } : d))
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
      <h2 className="text-2xl font-bold mb-4">Rejected Deposits</h2>

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
                <th className="py-2 px-4 border-b">User ID</th>
                <th className="py-2 px-4 border-b">Amount</th>
                <th className="py-2 px-4 border-b">Type</th>
                <th className="py-2 px-4 border-b">UTR</th>
                <th className="py-2 px-4 border-b">Reject Reason</th>
                <th className="py-2 px-4 border-b">Document</th>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit) => (
                <tr key={deposit._id}>
                  <td className="py-2 px-4 border-b">{deposit.userId}</td>
                  <td className="py-2 px-4 border-b">{deposit.amount}</td>
                  <td className="py-2 px-4 border-b">{deposit.amountType}</td>
                  <td className="py-2 px-4 border-b">{deposit.utr}</td>
                  <td className="py-2 px-4 border-b">
                    {editMode === deposit._id ? (
                      <textarea
                        className="w-full p-1 text-white rounded"
                        value={editedReason}
                        onChange={(e) => setEditedReason(e.target.value)}
                      />
                    ) : (
                      <span className="text-white italic">
                        {deposit.reason || 'N/A'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {deposit.documentImage ? (
                      <img
                        src={`http://${BASE_URL}:3000/${deposit.documentImage.replace(/\\/g, '/')}`}
                        alt="Proof"
                        className="w-16 h-auto rounded"
                      />
                    ) : (
                      'No Doc'
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">{new Date(deposit.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b">
                    {editMode === deposit._id ? (
                      <>
                        <button
                          onClick={() => handleSave(deposit._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded"
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
                        onClick={() => handleEdit(deposit)}
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

export default RejectedDeposits;
