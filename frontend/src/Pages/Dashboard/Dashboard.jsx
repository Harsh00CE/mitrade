import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../utils/constant';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [marketStatus, setMarketStatus] = useState(false);
  const [scheduledClose, setScheduledClose] = useState(null);
  const [shouldClose, setShouldClose] = useState(false);
  const [isLoading, setIsLoading] = useState({
    status: false,
    toggle: false,
    schedule: false
  });
  const [scheduleForm, setScheduleForm] = useState({
    closeAt: '',
    reopenAt: ''
  });

  useEffect(() => {
    fetchMarketStatus();
  }, []);

  const fetchMarketStatus = async () => {
    try {
      setIsLoading(prev => ({...prev, status: true}));
      const { data } = await axios.get(`http://${BASE_URL}:3000/api/dashboard-login/market-status`);
      setMarketStatus(data.isMarketOn);
      setScheduledClose(data.nextScheduledClose);
      setShouldClose(data.shouldCloseNow);
    } catch (error) {
      toast.error('Failed to fetch market status');
      console.error('Market status error:', error);
    } finally {
      setIsLoading(prev => ({...prev, status: false}));
    }
  };

  const toggleMarketStatus = async () => {
    try {
      setIsLoading(prev => ({...prev, toggle: true}));
      const { data } = await axios.post(`http://${BASE_URL}:3000/api/dashboard-login/toggle-market`);
      setMarketStatus(data.isMarketOn);
      toast.success(data.message);
    } catch (error) {
      toast.error('Failed to toggle market status');
      console.error('Toggle error:', error);
    } finally {
      setIsLoading(prev => ({...prev, toggle: false}));
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(prev => ({...prev, schedule: true}));
      const { data } = await axios.post(`http://${BASE_URL}:3000/api/dashboard-login/set-reminder`, {
        closeAt: scheduleForm.closeAt
      });
      setScheduledClose(data.nextScheduledClose);
      setScheduleForm({ closeAt: '', reopenAt: '' });
      toast.success(data.message);
      await fetchMarketStatus();
    } catch (error) {
      toast.error('Failed to set market schedule');
      console.error('Schedule error:', error);
    } finally {
      setIsLoading(prev => ({...prev, schedule: false}));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm(prev => ({...prev, [name]: value }));
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-900 ">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Market Status Card */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Market Status</h2>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-100">Current status:</p>
                <p className={`text-lg font-bold ${
                  marketStatus ? 'text-green-600' : 'text-red-600'
                }`}>
                  {marketStatus ? 'OPEN' : 'CLOSED'}
                </p>
              </div>
              <button
                onClick={toggleMarketStatus}
                disabled={isLoading.toggle}
                className={`px-4 py-2 rounded text-white ${
                  marketStatus ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } ${isLoading.toggle ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading.toggle ? 'Processing...' : marketStatus ? 'Close Market' : 'Open Market'}
              </button>
            </div>

            {scheduledClose && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-100 mb-2">Scheduled Close</h3>
                <p className="text-gray-100">{formatDate(scheduledClose)}</p>
                {shouldClose && (
                  <p className="text-red-500 text-sm mt-1">
                    Scheduled close time has passed - please take action
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Schedule Market Close Card */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Schedule Market Close</h2>
            <form onSubmit={handleScheduleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-100 mb-2">Close Market At:</label>
                <input
                  type="datetime-local"
                  name="closeAt"
                  value={scheduleForm.closeAt}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-100 mb-2">Reopen At (optional):</label>
                <input
                  type="datetime-local"
                  name="reopenAt"
                  value={scheduleForm.reopenAt}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading.schedule}
                className={`w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                  isLoading.schedule ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading.schedule ? 'Setting Schedule...' : 'Set Schedule'}
              </button>
            </form>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setScheduleForm({ closeAt: '', reopenAt: '' })}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Clear Schedule Form
            </button>
            <button
              onClick={fetchMarketStatus}
              disabled={isLoading.status}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              {isLoading.status ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;