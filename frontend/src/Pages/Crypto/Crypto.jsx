import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../utils/constant";
import BackButton from "../../components/BackButton/BackButton";

const Crypto = () => {
    const [allTickers, setAllTickers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    // Replace with actual user ID from your auth system
    const userId = "67ea83a1df43302963e04095";

    const { sendMessage, lastMessage } = useWebSocket(`ws://${BASE_URL}:8080`, {
        onOpen: () => {
            console.log("Connected to Crypto WebSocket");
            sendMessage(JSON.stringify({
                type: "subscribeFavorites",
                userId
            }));
        },
        onError: (event) => console.error("WebSocket Error:", event),
        shouldReconnect: () => true,
        reconnectInterval: 3000
    });

    useEffect(() => {
        if (lastMessage) {
            try {
                const data = JSON.parse(lastMessage.data);
                if (data.type === "allTokens" && Array.isArray(data.data)) {
                    setAllTickers(data.data);
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        }
    }, [lastMessage]);

    const handleCoinClick = (instrument) => {
        navigate(`/admin/${instrument}`);
    };

    const filteredTickers = allTickers.filter((ticker) =>
        ticker.instrument.toLowerCase().includes(search.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTickers = filteredTickers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTickers.length / itemsPerPage);

    return (
        <div className="p-4 sm:p-6 bg-gray-900 min-h-screen w-full text-white">
            <div className="p-4">
                <BackButton />
                <h1 className="text-2xl font-bold text-center mt-4 text-blue-400">
                    📈 Real-Time Crypto Dashboard
                </h1>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search token instrument..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full sm:w-1/2 p-2 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <TokenTable
                title="📊 All Crypto"
                tickers={currentTickers}
                handleCoinClick={handleCoinClick}
            />

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-500 w-full sm:w-auto"
                >
                    Previous
                </button>
                <p className="text-center">
                    Page {currentPage} of {totalPages}
                </p>
                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-500 w-full sm:w-auto"
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
            <h2 className="text-lg sm:text-xl font-semibold text-blue-500 mb-4">{title}</h2>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto rounded-xl">
                <table className="w-full border-collapse shadow-md bg-gray-800 rounded-lg text-white">
                    <thead className="bg-blue-600 text-white uppercase text-sm">
                        <tr>
                            <th className="py-3 px-4 text-left">instrument</th>
                            <th className="py-3 px-4 text-left">bid</th>
                            <th className="py-3 px-4 text-left">24h Change</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickers.length > 0 ? (
                            tickers.map((ticker, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-gray-700 hover:bg-gray-700 transition duration-200 cursor-pointer"
                                >
                                    <td className="py-3 px-4 font-medium" onClick={() => handleCoinClick(ticker.instrument)}>
                                        {ticker.instrument}
                                    </td>
                                    <td className="py-3 px-4">${parseFloat(ticker.bid).toFixed(4)}</td>
                                    <td className={`py-3 px-4 font-semibold ${parseFloat(ticker.spread) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {parseFloat(ticker.spread).toFixed(2)}%
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm"
                                            onClick={() => handleCoinClick(ticker.instrument)}
                                        >
                                            Trade
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-4 text-gray-400">
                                    Loading crypto data...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden flex flex-col gap-4">
                {tickers.length > 0 ? (
                    tickers.map((ticker, index) => (
                        <div
                            key={index}
                            className="bg-gray-800 p-4 rounded-lg shadow-md space-y-2"
                            onClick={() => handleCoinClick(ticker.instrument)}
                        >
                            <div className="flex justify-between">
                                <span className="text-blue-400 font-semibold">{ticker.instrument}</span>
                                <span>${parseFloat(ticker.bid).toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>24h Change:</span>
                                <span className={parseFloat(ticker.spread) >= 0 ? "text-green-400" : "text-red-400"}>
                                    {parseFloat(ticker.spread).toFixed(2)}%
                                </span>
                            </div>
                            <div className="text-right">
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm"
                                    onClick={() => handleCoinClick(ticker.instrument)}
                                >
                                    Trade
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400">Loading crypto data...</p>
                )}
            </div>
        </div>
    );
};

export default Crypto;