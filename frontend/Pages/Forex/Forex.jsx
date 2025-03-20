import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import TradingViewChart from "../Chart/TradingViewChart";

const Dashboard = () => {
    const [forexTickers, setForexTickers] = useState([]);
    const [selectedSymbol, setSelectedSymbol] = useState(null); 

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

           if (data.type === "forexTokens") {
                setForexTickers(data.data);
            }
        }
    }, [lastMessage]);

    const handleCoinClick = (symbol) => {
        setSelectedSymbol(symbol);
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Real-Time Crypto & Forex Prices</h1>

            {selectedSymbol && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        TradingView Chart for {selectedSymbol}
                    </h2>
                    <div style={{ padding: "20px", backgroundColor: "#121212" }}>
                        <h1 style={{ color: "#fff", marginBottom: "20px" }}>Crypto Price Chart</h1>
                        <TradingViewChart symbol={`BINANCE:${selectedSymbol}`} />
                    </div>
                </div>
            )}

 

            <TokenTable
                title="💱 Forex Prices"
                tickers={forexTickers}
                handleCoinClick={handleCoinClick}
            />
        </div>
    );
};

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