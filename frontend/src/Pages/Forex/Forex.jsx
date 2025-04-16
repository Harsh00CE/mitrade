import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { BASE_URL } from "../../utils/constant";
import { fullLoading } from "../../assets/imgs";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";

const Forex = () => {
    const [forexTickers, setForexTickers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const userId = "67dbae524f382518d92a2ca6"; // Example user ID

    const { sendMessage, lastMessage } = useWebSocket(`ws://${BASE_URL}:3001`, {
        onOpen: () => {
            console.log("✅ Connected to WebSocket");
            sendMessage(JSON.stringify({ type: "subscribeFavorites", userId }));
        },
        onMessage: () => setIsLoading(false),
        onError: (event) => console.error("❌ WebSocket Error: ", event),
        onClose: () => console.log("🔌 WebSocket Disconnected"),
    });

    useEffect(() => {
        if (lastMessage) {
            const data = JSON.parse(lastMessage.data);
            if (data.type === "allForexPrice") {
                setForexTickers(data.data);
            }
        }
    }, [lastMessage]);

    const handleSymbolClick = (symbol) => {
        navigate(`/admin/${symbol}`);
    };

    return (
        <div className="bg-gray-900 min-h-screen text-white">
            <div className="p-4">
                <BackButton />
                <h1 className="text-2xl font-bold text-center mt-4 text-blue-400">
                    📈 Real-Time Forex Dashboard
                </h1>
            </div>

            <div className="p-4">
                <TokenTable
                    title="💱 Forex Market"
                    tickers={forexTickers}
                    isLoading={isLoading}
                    handleSymbolClick={handleSymbolClick}
                />
            </div>
        </div>
    );
};

const TokenTable = ({ title, tickers, handleSymbolClick, isLoading }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredTickers = tickers.filter((ticker) =>
        ticker.instrument.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTickers.length / itemsPerPage);
    const currentTickers = filteredTickers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handlePrev = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <input
                    type="text"
                    placeholder="Search symbol..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full sm:w-1/2 p-2 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-blue-500 mb-4">{title}</h2>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse bg-gray-800 rounded-lg shadow-md">
                    <thead className="bg-blue-600 text-white uppercase text-sm">
                        <tr>
                            <th className="py-3 px-4 text-left">Symbol</th>
                            <th className="py-3 px-4 text-left">Bid (USD)</th>
                            <th className="py-3 px-4 text-left">Ask (USD)</th>
                            <th className="py-3 px-4 text-left">Spread</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4">
                                    <img src={fullLoading} alt="Loading..." className="w-12 mx-auto opacity-80" />
                                </td>
                            </tr>
                        ) : currentTickers.length > 0 ? (
                            currentTickers.map((ticker, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-gray-700 hover:bg-gray-700 cursor-pointer"
                                >
                                    <td className="py-3 px-4">{ticker.instrument}</td>
                                    <td className="py-3 px-4">${ticker.bid}</td>
                                    <td className="py-3 px-4">${ticker.ask}</td>
                                    <td className="py-3 px-4">{ticker.spread}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md"
                                            onClick={() => handleSymbolClick(ticker.instrument)}
                                        >
                                            Config
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-400">
                                    No forex data found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <img src={fullLoading} alt="Loading..." className="w-12 opacity-80" />
                    </div>
                ) : currentTickers.length > 0 ? (
                    currentTickers.map((ticker, index) => (
                        <div
                            key={index}
                            className="bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-700 space-y-2"
                        >
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Symbol</span>
                                <span className="font-semibold text-blue-400">{ticker.instrument}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Bid</span>
                                <span>${ticker.bid}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Ask</span>
                                <span>${ticker.ask}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Spread</span>
                                <span>{ticker.spread}</span>
                            </div>
                            <div className="text-right">
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm"
                                    onClick={() => handleSymbolClick(ticker.instrument)}
                                >
                                    Config
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400">No data found.</p>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="text-blue-400 font-semibold">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};




export default Forex;
