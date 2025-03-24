import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useNavigate } from "react-router-dom";
import TradingViewChart from "../Chart/TradingViewChart";

const Dashboard = () => {
    const [allTickers, setAllTickers] = useState([]);
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const navigate = useNavigate();
    const userId = "67dbae524f382518d92a2ca6";

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
            if (data.type === "allTokens") setAllTickers(data.data);
        }
    }, [lastMessage]);

    const handleCoinClick = (symbol) => {
        navigate(`/admin/${symbol}`);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTickers = allTickers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(allTickers.length / itemsPerPage);

    return (
        <div className="p-6 bg-gray-900 min-h-screen w-full text-white">
            <h1 className="text-2xl font-bold text-blue-500 mb-6">Real-Time Crypto & Forex Prices</h1>

            {selectedSymbol && (
                <div className="mb-8 bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-blue-400 mb-4">
                        TradingView Chart for {selectedSymbol}
                    </h2>
                    <TradingViewChart symbol={`BINANCE:${selectedSymbol}`} />
                </div>
            )}

            <TokenTable title="📊 All Tokens" tickers={currentTickers} handleCoinClick={handleCoinClick} />

            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-500"
                >
                    Previous
                </button>
                <p>Page {currentPage} of {totalPages}</p>
                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-500"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

const TokenTable = ({ title, tickers, handleCoinClick }) => {
    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-blue-500 mb-4">{title}</h2>
            <div className="overflow-x-auto rounded-xl">
                <table className="w-full border-collapse shadow-md bg-gray-800 rounded-lg text-white">
                    <thead className="bg-blue-600 text-white uppercase text-sm">
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
                                <tr key={index} className="border-b border-gray-700 hover:bg-gray-700 transition duration-200 cursor-pointer">
                                    <td className="py-3 px-4 font-medium" onClick={() => handleCoinClick(ticker.symbol)}>
                                        {ticker.symbol}
                                    </td>
                                    <td className="py-3 px-4">${ticker.price}</td>
                                    <td className="py-3 px-4">{ticker.volume}</td>
                                    <td className={`py-3 px-4 font-semibold ${ticker.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {ticker.change}%
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm"
                                            onClick={() => handleCoinClick(ticker.symbol)}
                                        >
                                            Config
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-400">
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
