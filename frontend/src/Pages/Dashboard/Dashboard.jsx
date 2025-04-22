import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../utils/constant';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [marketStatus, setMarketStatus] = useState(false);
  const [scheduledClose, setScheduledClose] = useState(null);
  const [scheduledReopen, setScheduledReopen] = useState(null);
  const [closeReason, setCloseReason] = useState('');
  const [shouldClose, setShouldClose] = useState(false);
  const [isLoading, setIsLoading] = useState({ status: false, toggle: false, schedule: false });
  const [scheduleForm, setScheduleForm] = useState({ closeAt: '', reopenAt: '' });

  useEffect(() => {
    fetchMarketStatus();
  }, []);

  const fetchMarketStatus = async () => {
    try {
      setIsLoading(prev => ({ ...prev, status: true }));
      const { data } = await axios.get(`http://${BASE_URL}:3000/api/market/market-status`);
      setMarketStatus(data.isMarketOn);
      setScheduledClose(data.nextScheduledClose);
      setScheduledReopen(data.nextScheduledReopen);
      setCloseReason(data.closeReason || '');
      setShouldClose(data.shouldCloseNow || false);
    } catch (error) {
      toast.error('Failed to fetch market status');
      console.error(error);
    } finally {
      setIsLoading(prev => ({ ...prev, status: false }));
    }
  };

  const toggleMarket = async () => {
    try {

      if (!closeReason) {
        alert("Close reason is required to close the market");
        return;
      }


      setIsLoading(prev => ({ ...prev, toggle: true }));
      const { data } = await axios.post(`http://${BASE_URL}:3000/api/market/toggle-market`, {
        closeReason: closeReason
      });
      setMarketStatus(data.isMarketOn);
      setCloseReason(data.closeReason || '');
      toast.success(data.message);
    } catch (error) {
      toast.error('Toggle failed');
      console.error(error);
    } finally {
      setIsLoading(prev => ({ ...prev, toggle: false }));
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(prev => ({ ...prev, schedule: true }));
      const payload = {
        closeAt: scheduleForm.closeAt,
        reopenAt: scheduleForm.reopenAt
      };

      const { data } = await axios.post(`http://${BASE_URL}:3000/api/market/set-reminder`, payload);
      setScheduledClose(data.nextScheduledClose);
      setScheduledReopen(data.nextScheduledReopen);
      toast.success(data.message);
      setScheduleForm({ closeAt: '', reopenAt: '' });
      fetchMarketStatus();
    } catch (error) {
      toast.error('Failed to schedule');
      console.error(error);
    } finally {
      setIsLoading(prev => ({ ...prev, schedule: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm(prev => ({ ...prev, [name]: value }));
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button onClick={logout} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700">
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Market Status Card */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Market Status</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm">Current Status:</p>
                <p className={`text-2xl font-bold ${marketStatus ? 'text-green-500' : 'text-red-500'}`}>
                  {marketStatus ? 'OPEN' : 'CLOSED'}
                </p>
              </div>
              <button
                onClick={toggleMarket}
                disabled={isLoading.toggle}
                className={`px-4 py-2 rounded ${marketStatus ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  } ${isLoading.toggle ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading.toggle ? 'Processing...' : marketStatus ? 'Close Market' : 'Open Market'}
              </button>
            </div>

            {!marketStatus && closeReason && (
              <div className="text-sm text-yellow-400 mb-2">
                Close Reason: {closeReason}
              </div>
            )}

            {marketStatus && (
              <div className="mb-4">
                <label className="block mb-1">Close Reason</label>
                <textarea
                  rows={3}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                  placeholder="Reason for closing market"
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm mb-1">Scheduled Close:</p>
              <p>{formatDateTime(scheduledClose)}</p>
              {scheduledReopen && (
                <>
                  <p className="text-sm mt-3">Scheduled Reopen:</p>
                  <p>{formatDateTime(scheduledReopen)}</p>
                </>
              )}
              {shouldClose && (
                <p className="text-red-400 text-sm mt-2">Scheduled time passed - action required!</p>
              )}
            </div>
          </div>

          {/* Schedule Form */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Schedule Market</h2>
            <form onSubmit={handleSchedule}>
              <div className="mb-4">
                <label className="block mb-1">Close At <span className="text-red-400">*</span></label>
                <input
                  type="datetime-local"
                  name="closeAt"
                  value={scheduleForm.closeAt}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Reopen At (optional)</label>
                <input
                  type="datetime-local"
                  name="reopenAt"
                  value={scheduleForm.reopenAt}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading.schedule}
                className={`w-full py-2 bg-blue-600 hover:bg-blue-700 rounded ${isLoading.schedule ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isLoading.schedule ? 'Scheduling...' : 'Set Schedule'}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setScheduleForm({ closeAt: '', reopenAt: '' })}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
            >
              Clear Schedule Form
            </button>
            <button
              onClick={fetchMarketStatus}
              disabled={isLoading.status}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
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
