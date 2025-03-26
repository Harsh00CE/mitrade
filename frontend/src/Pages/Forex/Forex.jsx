import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import TradingViewChart from "../Chart/TradingViewChart";
import { BASE_URL } from "../../utils/constant";

const Forex = () => {
    const [forexTickers, setForexTickers] = useState([]);
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const userId = "67dbae524f382518d92a2ca6";

    const { sendMessage, lastMessage } = useWebSocket(`ws://${BASE_URL}:8080`, { 
        onOpen: () => {
            console.log("✅ Connected to WebSocket");
            sendMessage(JSON.stringify({ type: "subscribeFavorites", userId }));
        },
        onMessage: () => setIsLoading(false),
        onError: (event) => console.error("❌ WebSocket Error: ", event),
    });

    useEffect(() => {
        if (lastMessage) {
            const data = JSON.parse(lastMessage.data);
            if (data.type === "forexData") {
                setForexTickers(data.data);
            }
        }
    }, [lastMessage]);

    const handleSymbolClick = (symbol) => {
        setSelectedSymbol(symbol);
    };

    return (
        <div className="w-full h-screen flex flex-col bg-gray-900 text-white">
            {/* Header */}
            <div className="w-full p-6 bg-blue-600 shadow-md">
                <h1 className="text-3xl font-bold text-center">📈 Real-Time Forex Dashboard</h1>
            </div>

            {/* Content Layout */}
            <div className="flex flex-grow p-6 gap-6">
                {/* Forex Table */}
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
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 h-full overflow-y-auto">
            <h2 className="text-xl font-semibold text-white text-center mb-4">{title}</h2>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-blue-600 text-white text-sm uppercase sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4 text-left">Symbol</th>
                            <th className="py-3 px-4 text-left">Price (USD)</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-900 text-white">
                        {isLoading ? (
                            <tr>
                                <td colSpan="3" className="text-center py-4 text-gray-400">Loading...</td>
                            </tr>
                        ) : tickers.length > 0 ? (
                            tickers.map((ticker, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-gray-700 hover:bg-gray-700 transition duration-200 cursor-pointer"
                                >
                                    <td
                                        className="py-3 px-4 font-medium"
                                        onClick={() => handleSymbolClick(ticker.symbol)}
                                    >
                                        {ticker.symbol}
                                    </td>
                                    <td className="py-3 px-4">${ticker.price}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm"
                                            onClick={() => handleSymbolClick(ticker.symbol)}
                                        >
                                            Config
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="text-center py-4 text-gray-400">No forex data available.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Forex;