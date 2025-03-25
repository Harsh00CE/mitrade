import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
      const response = await axios.get("http://157.173.219.118:3000/api/users", {
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
    <div className="w-full p-6 font-sans mx-auto bg-gray-900 text-white shadow-lg">
      <h2 className="text-xl font-semibold text-blue-500 mb-4">Users 🙍‍♂️</h2>
      <table className="w-full border border-gray-700 shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-800 text-blue-400">
            <th className="py-3 px-4 border border-gray-700">User ID</th>
            <th className="py-3 px-4 border border-gray-700">Username</th>
            <th className="py-3 px-4 border border-gray-700">Email</th>
            <th className="py-3 px-4 border border-gray-700">Active</th>
            <th className="py-3 px-4 border border-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.userId} className="border-b border-gray-700 hover:bg-gray-800">
              <td className="py-3 px-4 border border-gray-700 text-center">{user.userId}</td>
              <td className="py-3 px-4 border border-gray-700 text-center">{user.username}</td>
              <td className="py-3 px-4 border border-gray-700 text-center">{user.email}</td>
              <td className="py-3 px-4 border border-gray-700 text-center">
                {user.balance > 0 ? (
                  <span className="text-green-400 font-semibold">Active</span>
                ) : (
                  <span className="text-red-400 font-semibold">Not Active</span>
                )}
              </td>
              <td className="py-3 px-4 border border-gray-700 text-center">
                <button
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md"
                  onClick={() => navigate(`/user-config/${user.userId}`)}
                >
                  Config
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <p className="text-center text-blue-400">Loading...</p>}

      <div className="flex justify-between items-center mt-6">
        <div>
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-gray-700"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
            disabled={page >= totalPages}
            className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-gray-700"
          >
            Next
          </button>
        </div>

        <p className="text-gray-400">
          Page {page} of {totalPages}
        </p>

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md"
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