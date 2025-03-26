import { useEffect, useState } from "react";

const ForexTable = () => {
    const [forexData, setForexData] = useState([]);

    useEffect(() => {
        const ws = new WebSocket("ws://192.168.0.103:8081");

        ws.onopen = () => {
            console.log("✅ Connected to WebSocket");
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("message ==> ", message);
            
            if (message.type === "forexTokens") {
                setForexData((prevData) => {
                    const updatedData = [...prevData];
                    message.data.forEach((newItem) => {
                        const index = updatedData.findIndex((item) => item.symbol === newItem.symbol);
                        if (index !== -1) {
                            updatedData[index] = newItem;
                        } else {
                            updatedData.push(newItem);
                        }
                    });
                    return updatedData;
                });
            }
        };

        ws.onerror = (error) => {
            console.error("❌ WebSocket Error:", error);
        };

        ws.onclose = () => {
            console.log("🔌 Disconnected from WebSocket");
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h2 style={{ textAlign: "center" }}>📈 Live Forex Prices</h2>
            <table border="1" width="100%" style={{ borderCollapse: "collapse", marginTop: "20px" }}>
                <thead>
                    <tr style={{ background: "#007bff", color: "white" }}>
                        <th style={{ padding: "10px" }}>Symbol</th>
                        <th style={{ padding: "10px" }}>Price (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    {forexData.length > 0 ? (
                        forexData.map((item, index) => (
                            <tr key={index} style={{ textAlign: "center" }}>
                                <td style={{ padding: "8px" }}>{item.symbol}</td>
                                <td style={{ padding: "8px" }}>${item.price}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="2" style={{ textAlign: "center", padding: "10px", color: "gray" }}>
                                No forex data available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ForexTable;
