import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useNavigate } from "react-router-dom";
import BalanceComponent from "../../src/components/BalanceComponent/BalanceComponent";
import PriceAlert from "../../src/components/PriceAlert";

const Dashboard = () => {
    const [tickers, setTickers] = useState([]);
    const navigate = useNavigate();

    const { lastMessage } = useWebSocket("ws://192.168.0.103:8080");

    useEffect(() => {
        if (lastMessage) {
            const data = JSON.parse(lastMessage.data);
            setTickers(data);
        }
    }, [lastMessage]);

    const handleCoinClick = (symbol) => {
        navigate(`/admin/${symbol}`);
    };

    const handleBuy = (symbol) => {
        console.log(`Buying ${symbol}`);
    };

    const handleSell = (symbol) => {
        console.log(`Selling ${symbol}`);
    };

    return (
        <div>
            <h1>Real-Time Crypto Prices</h1>
           <table>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Price (USD)</th>
                        <th>24h Volume</th>
                        <th>24h Change (%)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tickers.map((ticker, index) => (
                        <tr key={index} style={{ cursor: "pointer" }}>
                            <td onClick={() => handleCoinClick(ticker.symbol)}>{ticker.symbol}</td>
                            <td>${ticker.price}</td>
                            <td>{ticker.volume}</td>
                            <td>{ticker.change}%</td>
                            <td>
                                <button onClick={() => handleBuy(ticker.symbol)}>Buy</button>
                                <button onClick={() => handleSell(ticker.symbol)}>Sell</button>
                                <button onClick={() => handleCoinClick(ticker.symbol)}>Trade</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Dashboard;
