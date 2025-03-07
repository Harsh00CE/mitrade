import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useNavigate } from "react-router-dom";

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
        navigate(`/candlestick/${symbol}`);
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
                    </tr>
                </thead>
                <tbody>
                    {tickers.map((ticker, index) => (
                        <tr
                            key={index}
                            onClick={() => handleCoinClick(ticker.symbol)}
                            style={{ cursor: "pointer" }}
                        >
                            <td>{ticker.symbol}</td>
                            <td>${ticker.price}</td>
                            <td>{ticker.volume}</td>
                            <td>{ticker.change}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Dashboard;