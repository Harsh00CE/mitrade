import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useNavigate } from "react-router-dom";
import BalanceComponent from "../../src/components/BalanceComponent/BalanceComponent";
import PriceAlert from "../../src/components/PriceAlert";
import TradingViewChart from "../Chart/TradingViewChart";

const Dashboard = () => {
    const [allTickers, setAllTickers] = useState([]);
    const [favoriteTickers, setFavoriteTickers] = useState([]);
    const [adminTickers, setAdminTickers] = useState([]);
    const [selectedSymbol, setSelectedSymbol] = useState(null); // Track selected symbol for chart

    const navigate = useNavigate();
    const userId = "67ced33ed132690a73244906";

    const { sendMessage, lastMessage } = useWebSocket("ws://192.168.0.103:8080", {
        onOpen: () => {
            console.log("Connected to WebSocket ✅");
            sendMessage(JSON.stringify({ type: "subscribeFavorites", userId }));
        },
        onError: (event) => console.error("WebSocket Error: ", event),
    });

    useEffect(() => {
        if (lastMessage) {
            const data = JSON.parse(lastMessage.data);

            if (data.type === "allTokens") {
                setAllTickers(data.data);
            } else if (data.type === "favoriteTokens") {
                setFavoriteTickers(data.data);
            } else if (data.type === "adminTokens") {
                setAdminTickers(data.data);
            }
        }
    }, [lastMessage]);

    const handleCoinClick = (symbol) => {
        setSelectedSymbol(symbol); // Set the selected symbol for the chart
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Real-Time Crypto Prices</h1>

            {/* TradingView Chart */}
            {selectedSymbol && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        TradingView Chart for {selectedSymbol}
                    </h2>
                    <div style={{ padding: "20px", backgroundColor: "#121212" }}>
                        <h1 style={{ color: "#fff", marginBottom: "20px" }}>Crypto Price Chart</h1>
                        <TradingViewChart symbol={`BINANCE:${selectedSymbol}`} />
                    </div>
                    {/* <TradingViewChart symbol={`BINANCE:${selectedSymbol}`} /> */}
                </div>
            )}

            {/* Favorite Tokens Section */}
            <TokenTable
                title="⭐ Favorite Tokens"
                tickers={favoriteTickers}
                handleCoinClick={handleCoinClick}
            />

            {/* Admin Configured Tokens Section */}
            <TokenTable
                title="🔐 Admin Configured Tokens"
                tickers={adminTickers}
                handleCoinClick={handleCoinClick}
            />

            {/* All Tokens Section */}
            <TokenTable
                title="📊 All Tokens"
                tickers={allTickers}
                handleCoinClick={handleCoinClick}
            />
        </div>
    );
};

/* 🔄 Reusable Table Component */
const TokenTable = ({ title, tickers, handleCoinClick }) => {
    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">{title}</h2>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse shadow-md bg-white rounded-lg">
                    <thead className="bg-yellow-500 text-white uppercase text-sm">
                        <tr>
                            <th className="py-3 px-4 text-left">Symbol</th>
                            <th className="py-3 px-4 text-left">Price (USD)</th>
                            <th className="py-3 px-4 text-left">24h Volume</th>
                            <th className="py-3 px-4 text-left">24h Change (%)</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickers.length > 0 ? (
                            tickers.map((ticker, index) => (
                                <tr
                                    key={index}
                                    className="border-b hover:bg-gray-100 transition duration-200 cursor-pointer"
                                >
                                    <td
                                        className="py-3 px-4 text-gray-700 font-medium"
                                        onClick={() => handleCoinClick(ticker.symbol)}
                                    >
                                        {ticker.symbol}
                                    </td>
                                    <td className="py-3 px-4 text-gray-700">${ticker.price}</td>
                                    <td className="py-3 px-4 text-gray-700">{ticker.volume}</td>
                                    <td
                                        className={`py-3 px-4 font-semibold ${ticker.change >= 0 ? "text-green-500" : "text-red-500"
                                            }`}
                                    >
                                        {ticker.change}%
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-sm"
                                            onClick={() => handleCoinClick(ticker.symbol)}
                                        >
                                            Config
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-500">
                                    No data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;