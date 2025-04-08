import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { BASE_URL } from "../../utils/constant";
import { fullLoading } from "../../assets/imgs"; // Assuming logo isn't needed here
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";

const Forex = () => {
    const [forexTickers, setForexTickers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const userId = "67dbae524f382518d92a2ca6";
    const navigate = useNavigate();

    const { sendMessage, lastMessage } = useWebSocket(`ws://${BASE_URL}:3001`, {
        onOpen: () => {
            console.log("✅ Connected to WebSocket"); ``
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
                console.log("Forex Data: ", data.data);
                setForexTickers(data.data);
            }
        }
    }, [lastMessage]);

    const handleSymbolClick = (symbol) => {
        navigate(`/admin/${symbol}`);
    };

    return (
        <div className="w-full h-screen flex flex-col bg-gray-900 text-white">
            <div className="w-full ml-10 p-4">
                <BackButton />
            </div>

            <div className="w-full p-6 bg-blue-600 shadow-md">
                <h1 className="text-3xl font-bold text-center">📈 Real-Time Forex Dashboard</h1>
            </div>

            <div className="flex flex-grow p-6 gap-6">
                <div className="w-full">
                    <TokenTable
                        title="💱 Forex Prices"
                        tickers={forexTickers}
                        handleSymbolClick={handleSymbolClick}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );

};

const TokenTable = ({ title, tickers, handleSymbolClick, isLoading }) => {
    return (
        <div className="bg-gray-800 shadow-lg rounded-lg p-4 sm:p-6 h-full overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-semibold text-white text-center mb-4">{title}</h2>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-blue-600 text-white text-sm uppercase sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4 text-left">Symbol</th>
                            <th className="py-3 px-4 text-left">Bid (USD)</th>
                            <th className="py-3 px-4 text-left">Ask (USD)</th>
                            <th className="py-3 px-4 text-center">Spread</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-900 text-white">
                        {isLoading ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-400">
                                    <img className="mx-auto opacity-75 w-12" src={fullLoading} alt="Loading..." />
                                </td>
                            </tr>
                        ) : tickers.length > 0 ? (
                            tickers.map((ticker, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-gray-700 hover:bg-gray-700 transition duration-200"
                                >
                                    <td className="py-3 px-4 font-medium">{ticker.instrument}</td>
                                    <td className="py-3 px-4">${ticker.bid}</td>
                                    <td className="py-3 px-4">${ticker.ask}</td>
                                    <td className="py-3 px-4 text-center">{ticker.spread}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm"
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
                                    No forex data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="block sm:hidden space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <img className="w-12 opacity-75" src={fullLoading} alt="Loading..." />
                    </div>
                ) : tickers.length > 0 ? (
                    tickers.map((ticker, index) => (
                        <div
                            key={index}
                            className="bg-gray-900 rounded-lg p-4 shadow-md border border-gray-700"
                            onClick={() => handleSymbolClick(ticker.instrument)}
                        >
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-400">Symbol</span>
                                <span className="font-semibold">{ticker.instrument}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-400">Bid</span>
                                <span>${ticker.bid}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-400">Ask</span>
                                <span>${ticker.ask}</span>
                            </div>
                            <div className="flex justify-between mb-4">
                                <span className="text-gray-400">Spread</span>
                                <span>{ticker.spread}</span>
                            </div>
                            <button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                                onClick={() => handleSymbolClick(ticker.instrument)}
                            >
                                Config
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-400">No forex data available.</div>
                )}
            </div>
        </div>
    );
};


export default Forex;