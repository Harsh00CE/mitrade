import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../utils/constant";
import { fullLoading } from "../../assets/imgs";
import BackButton from "../../components/BackButton/BackButton";

const User = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://${BASE_URL}:3000/api/users`, {
        params: { page, limit },
      });

      setUsers(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 font-sans mx-auto bg-gray-900 text-white">

      <div className="mb-6 w-full ml-10">
        <BackButton/>
      </div>

      <h2 className="ml-10 text-lg sm:text-xl font-semibold text-blue-500 mb-4">Users 🙍‍♂️</h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border border-gray-700 shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-800 text-blue-400">
              <th className="py-2 px-3 sm:py-3 sm:px-4 border border-gray-700">User ID</th>
              <th className="py-2 px-3 sm:py-3 sm:px-4 border border-gray-700">Username</th>
              <th className="py-2 px-3 sm:py-3 sm:px-4 border border-gray-700">Email</th>
              <th className="py-2 px-3 sm:py-3 sm:px-4 border border-gray-700">Active</th>
              <th className="py-2 px-3 sm:py-3 sm:px-4 border border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId} className="border-b border-gray-700 hover:bg-gray-800">
                <td className="py-2 px-3 sm:py-3 sm:px-4 border border-gray-700 text-center">{user.userId}</td>
                <td className="py-2 px-3 sm:py-3 sm:px-4 border border-gray-700 text-center">{user.username}</td>
                <td className="py-2 px-3 sm:py-3 sm:px-4 border border-gray-700 text-center">{user.email}</td>
                <td className="py-2 px-3 sm:py-3 sm:px-4 border border-gray-700 text-center">
                  {user.balance > 0 ? (
                    <span className="text-green-400 font-semibold">Active</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Not Active</span>
                  )}
                </td>
                <td className="py-2 px-3 sm:py-3 sm:px-4 border border-gray-700 text-center">
                  <button
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                    onClick={() => navigate(`/user-config/${user.userId}`)}
                  >
                    Config
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="flex justify-center items-center mt-4">
          <img src={fullLoading} alt="Loading..." className="w-10 h-10 animate-spin" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <div className="flex gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-gray-700 text-sm"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-gray-700 text-sm"
          >
            Next
          </button>
        </div>

        <p className="text-gray-400 text-sm">
          Page <span className="font-semibold">{page}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
        </p>

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md text-sm"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>
    </div>
  );
};

export default User;
