import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../utils/constant";

const AdminRegister = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(`http://${BASE_URL}:3000/api/dashboard-register`, form);
      localStorage.setItem("adminToken", res.data.token);
      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="w-full max-w-sm bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-green-400 mb-4">Admin Register</h2>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-400 text-sm mb-3">{success}</p>}

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-green-500"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-green-500"
        />

        <button
          onClick={handleRegister}
          className="w-full py-2 bg-green-600 rounded-md hover:bg-green-500 transition"
        >
          Register
        </button>
      </div>
    </div>
  );
};

export default AdminRegister;
