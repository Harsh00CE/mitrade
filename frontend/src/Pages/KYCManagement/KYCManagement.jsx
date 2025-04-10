import { useEffect, useState } from "react";
import axios from "axios";

const KYCManagement = () => {
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImg, setPreviewImg] = useState(null);

  const fetchKYCs = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/kyc/submissions`);
      setKycs(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch KYC data", error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:3000/api/kyc/update-status/${id}`, { status });
      fetchKYCs();
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  useEffect(() => {
    fetchKYCs();
  }, []);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold text-blue-500 mb-6">🛡️ KYC Submissions</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-xl">
          <table className="min-w-full bg-gray-800 text-sm border border-gray-700">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Mobile</th>
                <th className="p-3 text-left">Nationality</th>
                <th className="p-3 text-left">Document</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {kycs.map((kyc) => (
                <tr key={kyc._id} className="border-t border-gray-700 hover:bg-gray-700 transition">
                  <td className="p-3">{kyc.fullName}</td>
                  <td className="p-3">{kyc.email}</td>
                  <td className="p-3">{kyc.mobile}</td>
                  <td className="p-3">{kyc.nationality}</td>
                  <td className="p-3 space-y-1">
                    {kyc.documentImage?.front && (
                      <img
                        src={kyc.documentImage.front}
                        alt="Front"
                        className="w-20 border rounded cursor-pointer"
                        onClick={() => setPreviewImg(kyc.documentImage.front)}
                      />
                    )}
                    {kyc.documentImage?.back && (
                      <img
                        src={kyc.documentImage.back}
                        alt="Back"
                        className="w-20 border rounded cursor-pointer"
                        onClick={() => setPreviewImg(kyc.documentImage.back)}
                      />
                    )}
                  </td>
                  <td
                    className={`p-3 font-semibold ${kyc.status === "approved"
                        ? "text-green-400"
                        : kyc.status === "rejected"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                  >
                    {kyc.status}
                  </td>
                  <td className="p-3 text-center">
                    <select
                      className="bg-gray-900 text-white p-2 rounded-md border border-gray-600"
                      value={kyc.status}
                      onChange={(e) => updateStatus(kyc._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔍 Image Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-xl max-w-xl w-full">
            <h3 className="text-blue-400 text-lg font-semibold mb-3">Document Preview</h3>
            <img src={previewImg} alt="Document" className="w-full rounded-lg border border-gray-600" />
            <div className="text-right mt-4">
              <button
                onClick={() => setPreviewImg(null)}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 text-white rounded-lg"
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

export default KYCManagement;
