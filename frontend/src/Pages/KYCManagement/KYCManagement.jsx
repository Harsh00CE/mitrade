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
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [isEditingReason, setIsEditingReason] = useState(false);

  const fetchKYCs = async () => {
    try {
      const res = await axios.get(`http://${BASE_URL}:3000/api/kyc/all`);
      setKycs(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch KYC data", error);
    }
  };


  useEffect(() => {
    fetchKYCs();
  }, []);

  const updateStatus = async (id, status) => {
    if (status === "rejected") {
      setSelectedKYC(id);
      setIsEditingReason(false);
      setShowReasonModal(true);
      return;
    }

    try {
      await axios.put(`http://${BASE_URL}:3000/api/kyc/update-status/${id}`, { status });
      fetchKYCs();
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  const confirmRejection = async () => {
    try {
      await axios.put(`http://${BASE_URL}:3000/api/kyc/update-status/${selectedKYC}`, {
        status: "rejected",
        reason: rejectionReason,
      });
      fetchKYCs();
    } catch (error) {
      console.error("Rejection failed", error);
    } finally {
      setShowReasonModal(false);
      setRejectionReason("");
      setSelectedKYC(null);
      setIsEditingReason(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-6 bg-gray-900 text-white overflow-scroll">
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
                <>
                  <tr key={kyc._id} className="border-t border-gray-700 hover:bg-gray-700 transition">
                    <td className="p-3 cursor-pointer" onClick={() => toggleExpand(kyc._id)}>
                      {kyc.fullName || [kyc.fname, kyc.mname, kyc.lname].filter(Boolean).join(" ")}
                      <span className="ml-2 text-blue-400">[+]</span>
                    </td>
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
                  {expandedRow === kyc._id && (
                    <tr key={`details-${kyc._id}`} className="bg-gray-800 border-t border-gray-700">
                      <td colSpan={7} className="p-4 text-gray-300 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><strong>Document Type:</strong> {kyc.documentType}</div>
                          <div><strong>Document Number:</strong> {kyc.documentNumber}</div>
                          <div><strong>Address:</strong> {kyc.address}</div>
                          <div><strong>Registered On:</strong> {moment(kyc.registrationDate).format("DD MMM YYYY, h:mm A")}</div>
                          {kyc.status === "rejected" && kyc.reason && (
                            <div className="col-span-2 text-red-400 flex justify-between items-center">
                              <span>
                                <strong>Rejection Reason:</strong> {kyc.reason}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedKYC(kyc._id);
                                  setRejectionReason(kyc.reason);
                                  setIsEditingReason(true);
                                  setShowReasonModal(true);
                                }}
                                className="ml-4 px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                              >
                                Edit Reason
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Preview Modal */}
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

      {/* Rejection Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-4">
              {isEditingReason ? "Edit Rejection Reason" : "Rejection Reason"}
            </h3>
            <textarea
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              rows="4"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />
            <div className="flex justify-end mt-4 space-x-3">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setRejectionReason("");
                  setSelectedKYC(null);
                  setIsEditingReason(false);
                }}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmRejection}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
              >
                {isEditingReason ? "Update Reason" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCManagement;
