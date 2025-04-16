import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  const handleClick = () => {
    navigate('/users');
  };

  return (
    <div className="bg-gray-900 text-white p-8">
      <div className="mt-8 flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md text-white"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold text-blue-400" onClick={handleClick} >Users</h2>
          <p className="text-gray-400 mt-2">Manage user accounts and permissions.</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold text-green-400">Reports</h2>
          <p className="text-gray-400 mt-2">View system logs and analytics.</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold text-yellow-400">Settings</h2>
          <p className="text-gray-400 mt-2">Configure dashboard preferences.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
