import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chart } from "react-chartjs-2";
import useWebSocket from "react-use-websocket";
import axios from "axios";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";

ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    CandlestickController,
    CandlestickElement,
    Tooltip,
    Legend
);

const CandlestickChart = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [historicalData, setHistoricalData] = useState([]);
    const [timeInterval, setTimeInterval] = useState("1h");
    const [currentPrice, setCurrentPrice] = useState(null);
    const [priceColor, setPriceColor] = useState("black"); 
    
    const { lastMessage } = useWebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);

    
    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchHistoricalData(symbol, timeInterval);
            setHistoricalData(data);
        };
        fetchData();
    }, [symbol, timeInterval]);

    useEffect(() => {
        if (lastMessage) {
            const tradeData = JSON.parse(lastMessage.data);
            const newPrice = parseFloat(tradeData.p).toFixed(2);

            setCurrentPrice((prevPrice) => {
                if (prevPrice) {
                    if (newPrice > prevPrice) {
                        setPriceColor("green"); 
                    } else if (newPrice < prevPrice) {
                        setPriceColor("red"); 
                    }
                }
                return newPrice;
            });
        }
    }, [lastMessage]);

    const fetchHistoricalData = async (symbol, interval) => {
        try {
            const response = await axios.get(
                `https://api.binance.com/api/v3/klines`,
                {
                    params: {
                        symbol: symbol.toUpperCase(),
                        interval: interval,
                        limit: 100,
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching historical data:", error);
            return [];
        }
    };

    const formatCandlestickData = (data) => {
        return data.map((kline) => ({
            x: new Date(kline[0]), 
            o: parseFloat(kline[1]), 
            h: parseFloat(kline[2]), 
            l: parseFloat(kline[3]), 
            c: parseFloat(kline[4]), 
        }));
    };
    const handleTimeIntervalChange = (interval) => {
        setTimeInterval(interval);
    };

    const handleBuy = () => {
        alert(`Buy ${symbol} at $${currentPrice}`);
    };

    const handleSell = () => {
        alert(`Sell ${symbol} at $${currentPrice}`);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>{symbol} Candlestick Chart</h1>
                <div style={styles.buttonContainer}>
                    <button onClick={() => handleTimeIntervalChange("1m")}>1m</button>
                    <button onClick={() => handleTimeIntervalChange("5m")}>5m</button>
                    <button onClick={() => handleTimeIntervalChange("15m")}>15m</button>
                    <button onClick={() => handleTimeIntervalChange("1h")}>1h</button>
                    <button onClick={() => handleTimeIntervalChange("1d")}>1d</button>
                </div>
                <button onClick={() => navigate("/")} style={styles.backButton}>
                    Back to Dashboard
                </button>
            </div>

            <div style={styles.priceContainer}>
                <h2 style={{ color: priceColor }}>Current Price: ${currentPrice}</h2>
                <div style={styles.actionButtons}>
                    <button onClick={handleBuy} style={styles.buyButton}>Buy</button>
                    <button onClick={handleSell} style={styles.sellButton}>Sell</button>
                </div>
            </div>

            <div style={styles.chartContainer}>
                <Chart
                    type="candlestick"
                    data={{
                        datasets: [
                            {
                                label: symbol,
                                data: formatCandlestickData(historicalData),
                                color: {
                                    up: "rgb(0, 255, 0)",
                                    down: "rgba(255, 0, 0, 1)",
                                },
                                borderWidth: 2,
                                borderColor: "rgba(0, 0, 0, 1)",
                                barThickness: 12,
                            },
                        ],
                    }}
                    options={chartOptions}
                />
            </div>
        </div>
    );
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: {
            type: "time",
            time: {
                unit: "minute",
            },
            ticks: {
                source: "auto",
            },
        },
        y: {
            beginAtZero: false,
        },
    },
    plugins: {
        legend: {
            display: true,
            position: "top",
        },
        tooltip: {
            enabled: true,
        },
    },
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        padding: "20px",
        backgroundColor: "#f5f5f5",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
    },
    buttonContainer: {
        display: "flex",
        gap: "10px",
    },
    backButton: {
        padding: "10px 20px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    priceContainer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
    },
    actionButtons: {
        display: "flex",
        gap: "10px",
    },
    buyButton: {
        padding: "10px 20px",
        backgroundColor: "green",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    sellButton: {
        padding: "10px 20px",
        backgroundColor: "red",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    chartContainer: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: "#fff",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        padding: "20px",
    },
};

export default CandlestickChart;