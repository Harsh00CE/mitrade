// src/pages/ApprovedDeposits.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/constant';
import BackButton from '../../components/BackButton/BackButton';

const ApprovedDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImg, setPreviewImg] = useState(null);

  const fetchApproved = async () => {
    try {
      const res = await axios.get(`http://${BASE_URL}:3000/api/deposit/all`);
      const approved = res.data.data?.filter((d) => d.status === 'approved') || [];
      setDeposits(approved);
    } catch (err) {
      console.error('Error fetching approved deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="flex ml-10 items-center mb-4">
        <BackButton />
      </div>
      <h2 className="text-2xl font-bold mb-4">Approved Deposits</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 text-white border border-gray-700 shadow-md">
            <thead className="bg-green-600">
              <tr>
                <th className="text-left py-2 px-4 border-b">User ID</th>
                <th className="text-left py-2 px-4 border-b">Amount</th>
                <th className="text-left py-2 px-4 border-b">Document</th>
                <th className="text-left py-2 px-4 border-b">Created At</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit) => (
                <tr key={deposit._id}>
                  <td className="py-2 px-4 border-b">{deposit.userId}</td>
                  <td className="py-2 px-4 border-b">{deposit.amount}</td>
                  <td className="py-2 px-4 border-b">
                    {deposit.documentImage ? (
                      <img
                        src={`http://${BASE_URL}:3000/${deposit.documentImage.replace(/\\/g, '/')}`}
                        alt="Proof"
                        className="w-16 h-auto rounded border cursor-pointer hover:scale-105 transition"
                        onClick={() =>
                          setPreviewImg(`http://${BASE_URL}:3000/${deposit.documentImage.replace(/\\/g, '/')}`)
                        }
                      />
                    ) : (
                      <span className="text-gray-500 italic">No Document</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {new Date(deposit.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewImg && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Document Preview</h3>
            <img
              src={previewImg}
              alt="Document"
              className="max-h-[80vh] w-auto mx-auto rounded shadow-md border border-gray-300"
            />
            <div className="text-right mt-4">
              <button
                onClick={() => setPreviewImg(null)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovedDeposits;
