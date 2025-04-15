// src/pages/AdminDeposits.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/constant';
import BackButton from '../../components/BackButton/BackButton';

const DepositReport = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [rejectReason, setRejectReason] = useState({});
  const [openRejectForm, setOpenRejectForm] = useState(null);

  const fetchDeposits = async () => {
    try {
      const res = await axios.get(`http://${BASE_URL}:3000/api/deposit/all`);
      const pendingDeposits = res.data.data.filter(d => d.status === 'pending');
      setDeposits(pendingDeposits);
    } catch (err) {
      console.error('Error fetching deposits:', err);
      setMessage('Error fetching deposit data');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await axios.post(`http://${BASE_URL}:3000/api/deposit/approve/${id}`);
      setMessage(res.data.message);
      setMessageType(res.data.success ? 'success' : 'error');
      fetchDeposits();
    } catch (error) {
      console.error('Error approving deposit:', error);
      setMessage('Error approving deposit');
      setMessageType('error');
    }
  };

  const handleReject = async (id) => {
    const reason = rejectReason[id];
    if (!reason || reason.trim() === '') {
      setMessage('Rejection reason is required');
      setMessageType('error');
      return;
    }

    try {
      const res = await axios.post(`http://${BASE_URL}:3000/api/deposit/reject`, {
        depositId: id,
        reason,
      });
      setMessage(res.data.message);
      setMessageType(res.data.success ? 'success' : 'error');
      fetchDeposits();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      setMessage('Error rejecting deposit');
      setMessageType('error');
    }
  };

  const handleInputChange = (id, value) => {
    setRejectReason(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="flex ml-10 items-center mb-4">
        <BackButton />
      </div>
      <h2 className="text-2xl font-bold mb-4">Pending Deposits</h2>

      {message && (
        <div className={`p-4 mb-4 rounded ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
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
                <th className="text-left py-2 px-4 border-b">UTR</th>
                <th className="text-left py-2 px-4 border-b">Status</th>
                <th className="text-left py-2 px-4 border-b">Document</th>
                <th className="text-left py-2 px-4 border-b">Created At</th>
                <th className="text-left py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit) => (
                <React.Fragment key={deposit._id}>
                  <tr>
                    <td className="py-2 px-4 border-b">{deposit.userId}</td>
                    <td className="py-2 px-4 border-b">{deposit.amount}</td>
                    <td className="py-2 px-4 border-b">{deposit.amountType}</td>
                    <td className="py-2 px-4 border-b">{deposit.utr}</td>
                    <td className="py-2 px-4 border-b capitalize">{deposit.status}</td>
                    <td className="py-2 px-4 border-b">
                      {deposit.documentImage ? (
                        <img
                          src={`http://${BASE_URL}:3000/${deposit.documentImage.replace(/\\/g, '/')}`}
                          alt="Proof"
                          className="w-16 h-auto rounded border cursor-pointer hover:scale-105 transition"
                        />
                      ) : (
                        <span className="text-gray-500 italic">No Document</span>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(deposit.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        className="bg-green-600 text-white py-1 w-full m-1 px-4 rounded"
                        onClick={() => handleApprove(deposit._id)}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-600 text-white py-1 w-full m-1 px-4 rounded"
                        onClick={() => setOpenRejectForm(openRejectForm === deposit._id ? null : deposit._id)}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                  {openRejectForm === deposit._id && (
                    <tr>
                      <td colSpan="8" className="bg-gray-700 p-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          <textarea
                            placeholder="Enter rejection reason..."
                            value={rejectReason[deposit._id] || ''}
                            onChange={(e) => handleInputChange(deposit._id, e.target.value)}
                            className="w-full sm:w-2/3 p-2 rounded bg-black-800 border border-black-600 text-white"
                          />
                          <button
                            onClick={() => handleReject(deposit._id)}
                            className="bg-red-500 px-4 py-2 rounded text-white"
                          >
                            Submit Rejection
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DepositReport;