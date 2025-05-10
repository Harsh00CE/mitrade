import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../utils/constant";

const API_URL = `http://${BASE_URL}:3000/api/rate/all`; // Adjust as needed

const Rate = () => {
    const [rates, setRates] = useState([]);
    const [form, setForm] = useState({ currency: "", rate: "", date: "" });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        const res = await fetch(API_URL);
        const data = await res.json();
        setRates(data.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            currency: form.currency.toUpperCase(),
            rate: parseFloat(form.rate),
            date: new Date(form.date),
        };

        const url = editingId
            ? `http://${BASE_URL}:3000/api/rate/update`
            : API_URL;
        const method = editingId ? "PUT" : "POST";

        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        setForm({ currency: "", rate: "", date: "" });
        setEditingId(null);
        fetchRates();
    };

    const handleEdit = (rate) => {
        console.log("🚀 ~ handleEdit ~ rate:", rate);
        setForm({
            currency: rate.currency,
            rate: rate.rate,
            date: rate.date.split("T")[0], // format YYYY-MM-DD
        });
        setEditingId(rate._id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this rate?")) {
            await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            fetchRates();
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto text-white bg-gray-900 min-h-screen">
            <h2 className="text-2xl font-bold mb-4 text-center">
                Rate Management
            </h2>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
                <input
                    type="text"
                    placeholder="Currency (e.g. EUR)"
                    value={form.currency}
                    onChange={(e) =>
                        setForm({ ...form, currency: e.target.value })
                    }
                    className="border p-2 rounded bg-gray-800 border-gray-600 placeholder-gray-400"
                    required
                />
                <input
                    type="number"
                    step="0.0001"
                    placeholder="Rate"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className="border p-2 rounded bg-gray-800 border-gray-600 placeholder-gray-400"
                    required
                />
                <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="border p-2 rounded bg-gray-800 border-gray-600 placeholder-gray-400"
                    required
                />
                {editingId && (
                    <button
                        type="submit"
                        className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition"
                    >
                        {editingId ? "Update" : "Add"}
                    </button>
                )}
            </form>

            {/* Table */}
            <div className="w-full overflow-x-auto">
                <table className="min-w-full border border-gray-700 shadow-md rounded-lg">
                    <thead>
                        <tr className="bg-gray-800 text-blue-400">
                            <th className="py-2 px-3 border border-gray-700 text-center">
                                Currency
                            </th>
                            <th className="py-2 px-3 border border-gray-700 text-center">
                                Rate
                            </th>
                            <th className="py-2 px-3 border border-gray-700 text-center">
                                Date
                            </th>
                            <th className="py-2 px-3 border border-gray-700 text-center">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rates.map((rate) => (
                            <tr
                                key={rate._id}
                                className="border-b border-gray-700 hover:bg-gray-800"
                            >
                                <td className="py-2 px-3 border border-gray-700 text-center">
                                    {rate.currency}
                                </td>
                                <td className="py-2 px-3 border border-gray-700 text-center">
                                    {rate.rate}
                                </td>
                                <td className="py-2 px-3 border border-gray-700 text-center">
                                    {new Date(rate.date).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-3 border border-gray-700 text-center space-x-2">
                                    <button
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
                                        onClick={() => handleEdit(rate)}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {rates.length === 0 && (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="text-center py-4 text-gray-400"
                                >
                                    No rates available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Rate;
