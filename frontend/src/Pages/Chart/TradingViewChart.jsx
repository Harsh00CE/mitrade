import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { loader } from "../../assets/imgs";

const TradingViewChart = () => {
    const chartRef = useRef(null);
    const { symbol } = useParams();
    const formattedSymbol = symbol.replace("_", "");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (chartRef.current) {
            setIsLoading(true);

            const widget = new window.TradingView.widget({
                width: "100%",
                height: 425,
                symbol: formattedSymbol,
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
                loading_screen: { backgroundColor: "#1e1e1e" },
                autosize: false,
            });

            // TradingView widget doesn't have a built-in callback when loading completes
            // So we'll use a timeout as a fallback
            const loadingTimeout = setTimeout(() => {
                setIsLoading(false);
            }, 3000); // Adjust timeout as needed

            return () => {
                clearTimeout(loadingTimeout);
                widget.remove();
            };
        }
    }, [symbol]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '425px' }}>
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#1e1e1e',
                    zIndex: 10
                }}>
                    <img src={loader} alt="Loading..." style={{ width: '50px', height: '50px' }} />
                </div>
            )}
            <div
                id="tradingview-chart"
                ref={chartRef}
                style={{
                    width: "100%",
                    height: "305px",
                    backgroundColor: "#1e1e1e",
                    visibility: isLoading ? 'hidden' : 'visible'
                }}
            ></div>
        </div>
    );
};

export default TradingViewChart;