import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const TradingViewChart = () => {

    const chartRef = useRef(null);
    const { symbol } = useParams();
    console.log("symbol => ", symbol);

    useEffect(() => {
        if (chartRef.current) {
            new window.TradingView.widget({
                width: "100%",
                height: 250,
                symbol: symbol,
                interval: "1", 
                timezone: "Etc/UTC",
                theme: "dark", 
                style: "1",
                locale: "en",
                toolbar_bg: "#1e1e1e",
                container_id: chartRef.current.id,

                enable_publishing: false,
                hide_top_toolbar: false, 
                hide_side_toolbar: true,
                hide_legend: true, 
                allow_symbol_change: false,
                details: false, 
                withdateranges: false,
                hide_volume: true,
                hideideas: true, 
                hide_topleft_logo: true,
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