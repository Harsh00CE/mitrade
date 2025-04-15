import React, { useEffect, useState } from 'react'
import { BASE_URL } from '../../utils/constant'
import BackButton from '../../components/BackButton/BackButton'

const BuyHistory = () => {
    const [buyOrders, setBuyOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch(`http://${BASE_URL}:3000/api/order-history`)
                const json = await res.json()

                if (json.success && Array.isArray(json.data)) {
                    const buys = json.data.filter((order) => order.type === 'buy')
                    setBuyOrders(buys)
                }
            } catch (error) {
                console.error('Error fetching orders:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [])

    return (
        <div className="p-4 sm:p-6 bg-gray-900 text-white min-h-screen w-full">

            <div className="mb-6 w-full ml-10">
                <BackButton/>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-blue-500 mb-6">Buy Order History</h2>

            {loading ? (
                <p className="text-gray-300">Loading...</p>
            ) : buyOrders.length === 0 ? (
                <p className="text-gray-400">No buy orders found.</p>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto rounded-lg">
                        <table className="min-w-full bg-gray-800 border border-gray-700 text-white rounded-lg">
                            <thead className="bg-blue-600 text-white uppercase text-sm">
                                <tr>
                                    <th className="px-4 py-3 text-left">userId</th>
                                    <th className="px-4 py-3 text-left">Symbol</th>
                                    <th className="px-4 py-3 text-left">Qty</th>
                                    <th className="px-4 py-3 text-left">Open</th>
                                    <th className="px-4 py-3 text-left">Close</th>
                                    <th className="px-4 py-3 text-left">P/L</th>
                                    <th className="px-4 py-3 text-left">Leverage</th>
                                    <th className="px-4 py-3 text-left">Margin</th>
                                    <th className="px-4 py-3 text-left">Open Time</th>
                                    <th className="px-4 py-3 text-left">Close Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {buyOrders.map((order) => (
                                    <tr key={order._id} className="border-t border-gray-700 hover:bg-gray-700 transition">
                                        <td className="px-4 py-2">{order.userId}</td>
                                        <td className="px-4 py-2">{order.symbol}</td>
                                        <td className="px-4 py-2">{order.quantity}</td>
                                        <td className="px-4 py-2">{order.openingPrice}</td>
                                        <td className="px-4 py-2">{order.closingPrice}</td>
                                        <td
                                            className={`px-4 py-2 font-semibold ${order.realisedPL > 0
                                                    ? 'text-green-400'
                                                    : order.realisedPL < 0
                                                        ? 'text-red-400'
                                                        : 'text-gray-400'
                                                }`}
                                        >
                                            {order.realisedPL.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2">{order.leverage}</td>
                                        <td className="px-4 py-2">{order.margin}</td>
                                        <td className="px-4 py-2 text-xs">{new Date(order.openingTime).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-xs">{new Date(order.closingTime).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden flex flex-col gap-4">
                        {buyOrders.map((order) => (
                            <div key={order._id} className="bg-gray-800 p-4 rounded-lg shadow-md space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-400 font-semibold">{order.symbol}</span>
                                    <span>Qty: {order.quantity}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-300">
                                    <span>Open:</span>
                                    <span>{order.openingPrice}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-300">
                                    <span>Close:</span>
                                    <span>{order.closingPrice}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span>P/L:</span>
                                    <span
                                        className={
                                            order.realisedPL > 0
                                                ? 'text-green-400'
                                                : order.realisedPL < 0
                                                    ? 'text-red-400'
                                                    : 'text-gray-400'
                                        }
                                    >
                                        {order.realisedPL.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Leverage:</span>
                                    <span>{order.leverage}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Margin:</span>
                                    <span>{order.margin}</span>
                                </div>
                                <div className="text-xs text-gray-400">
                                    <div>Open: {new Date(order.openingTime).toLocaleString()}</div>
                                    <div>Close: {new Date(order.closingTime).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default BuyHistory
