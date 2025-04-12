import { useEffect, useState } from "react";
import { BASE_URL } from "./../../utils/constant.js";
import axios from "axios";
import moment from "moment";
import BackButton from "../../components/BackButton/BackButton.jsx";

const KYCManagement = () => {
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImg, setPreviewImg] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchKYCs = async () => {
    try {
      const res = await axios.get(`http://${BASE_URL}:3000/api/kyc/all`);
      setKycs(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch KYC data", error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://${BASE_URL}:3000/api/kyc/update-status/${id}`, { status });
      fetchKYCs();
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  useEffect(() => {
    fetchKYCs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="w-full ml-10 p-4">
        <BackButton />
      </div>
      <h2 className="text-2xl font-bold text-blue-500 mb-6">🛡️ KYC Submissions</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-xl">
          <table className="min-w-full bg-gray-800 text-sm border border-gray-700">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3 text-left">Full Name</th>
                {/* <th className="p-3 text-left">First</th>
                <th className="p-3 text-left">Middle</th>
                <th className="p-3 text-left">Last</th> */}
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
                  <td className="p-3 cursor-pointer" onClick={() => toggleExpand(kyc._id)}>
                    {kyc.fullName || [kyc.fname, kyc.mname, kyc.lname].filter(Boolean).join(" ")}
                    <span className="ml-2 text-blue-400">[+]</span>
                  </td>
                  {/* <td className="p-3">{kyc.fname || "-"}</td>
                  <td className="p-3">{kyc.mname || "-"}</td>
                  <td className="p-3">{kyc.lname || "-"}</td> */}
                  <td className="p-3">{kyc.email}</td>
                  <td className="p-3">{kyc.mobile}</td>
                  <td className="p-3 capitalize">{kyc.nationality}</td>
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
              {expandedRow &&
                kycs
                  .filter((k) => k._id === expandedRow)
                  .map((kyc) => (
                    <tr key={`details-${kyc._id}`} className="bg-gray-800 text-sm text-gray-300 border-t border-gray-700">
                      <td colSpan={10} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* <div><strong>Gender:</strong> {kyc.gender}</div>
                          <div><strong>Date of Birth:</strong> {moment(kyc.dateOfBirth).format("DD MMM YYYY")}</div> */}
                          <div><strong>Document Type:</strong> {kyc.documentType}</div>
                          <div><strong>Document Number:</strong> {kyc.documentNumber}</div>
                          <div><strong>Address:</strong> {kyc.address}</div>
                          {/* <div><strong>Street:</strong> {kyc.address?.street}</div>
                          <div><strong>City:</strong> {kyc.address?.city}</div>
                          <div><strong>State:</strong> {kyc.address?.state}</div>
                          <div><strong>Postal Code:</strong> {kyc.address?.postalCode}</div>
                          <div><strong>Country:</strong> {kyc.address?.country}</div> */}
                          <div><strong>Registered On:</strong> {moment(kyc.registrationDate).format("DD MMM YYYY, h:mm A")}</div>
                        </div>
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
