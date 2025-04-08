import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../utils/constant";

const AdminLogin = () => {
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async () => {
        try {
            const res = await axios.post(`http://${BASE_URL}:3000/api/dashboard-login`, form);
            localStorage.setItem("adminToken", res.data.token);
        
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.error || "Login failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
            <div className="w-full max-w-sm bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-blue-400 mb-4">Admin Login</h2>

                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                />

                <button
                    onClick={handleLogin}
                    className="w-full py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition"
                >
                    Login
                </button>
                <p className="text-sm mt-3 text-center">
                    Don’t have an account?{" "}
                    <a href="/admin-register" className="text-blue-400 underline">
                        Register here
                    </a>
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
