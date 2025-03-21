import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import TradingViewChart from "../Chart/TradingViewChart";

const Forex = () => {
    const [forexTickers, setForexTickers] = useState([]);
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const userId = "67dbae524f382518d92a2ca6";

    const { sendMessage, lastMessage } = useWebSocket("ws://192.168.0.103:8080", {
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
            if (data.type === "forexTokens") {
                setForexTickers(data.data);
            }
        }
    }, [lastMessage]);

    const handleSymbolClick = (symbol) => {
        setSelectedSymbol(symbol);
    };

    return (
        <div className="w-full h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
            {/* Header */}
            <div className="w-full p-6 bg-white dark:bg-gray-800 shadow-md">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                    📈 Real-Time Forex Dashboard
                </h1>
            </div>

            {/* Content Layout */}
            <div className="flex flex-grow p-6 gap-6">
                {/* Left Panel - TradingView Chart */}
                {/* <div className="w-2/3 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
                    {selectedSymbol ? (
                        <>
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                TradingView Chart for {selectedSymbol}
                            </h2>
                            <div className="p-4 bg-gray-900 rounded-lg">
                                <TradingViewChart symbol={`FX:${selectedSymbol.replace("/", "")}`} />
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
                            Select a forex pair to view the chart 📊
                        </div>
                    )}
                </div> */}

                {/* Right Panel - Forex Table */}
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
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 h-full overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 text-center mb-4">
                {title}
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-yellow-500 text-white text-sm uppercase sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4 text-left">Symbol</th>
                            <th className="py-3 px-4 text-left">Price (USD)</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900">
                        {isLoading ? (
                            <tr>
                                <td colSpan="3" className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : tickers.length > 0 ? (
                            tickers.map((ticker, index) => (
                                <tr
                                    key={index}
                                    className="border-b hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200 cursor-pointer"
                                >
                                    <td
                                        className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium"
                                        onClick={() => handleSymbolClick(ticker.symbol)}
                                    >
                                        {ticker.symbol}
                                    </td>
                                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                        ${ticker.price}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-sm"
                                            onClick={() => handleSymbolClick(ticker.symbol)}
                                        >
                                            View Chart
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    No forex data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Forex;
