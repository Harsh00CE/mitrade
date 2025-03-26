import React, { useEffect, useRef } from "react";

const TradingViewChart = ({ symbol }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (chartRef.current) {
            new window.TradingView.widget({
                width: "100%",
                height: 250,
                symbol: symbol,
                interval: "D", // Daily interval
                timezone: "Etc/UTC",
                theme: "dark", // Dark mode
                style: "1",
                locale: "en",
                toolbar_bg: "#1e1e1e", // Dark toolbar background
                enable_publishing: false,
                allow_symbol_change: true,
                container_id: chartRef.current.id,
                // studies: [
                //     "MACD@tv-basicstudies",
                //     "RSI@tv-basicstudies",
                //     "KDJ@tv-basicstudies",
                //     "ATR@tv-basicstudies",
                //     "MAExp@tv-basicstudies", // Exponential Moving Average
                //     "BB@tv-basicstudies",    // Bollinger Bands
                // ],
            });
        }
    }, [symbol]);

    return (
        <div
            id="tradingview-chart"
            ref={chartRef}
            style={{
                width: "100%",

                backgroundColor: "#1e1e1e", 
            }}
        ></div>
    );
};

export default TradingViewChart;