import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

const TV_WS_URL = "wss://prodata.tradingview.com/socket.io/websocket";
const forexPairs = ["OANDA:EURUSD", "OANDA:GBPUSD", "OANDA:USDJPY", "OANDA:AUDUSD"];

const wss = new WebSocketServer({ port: 8081 });
console.log("✅ WebSocket server running on ws://localhost:8080");

// Connect to TradingView WebSocket
const tvWs = new WebSocket(TV_WS_URL, {
  headers: { Origin: "https://www.tradingview.com" },
});

const session = `qs_${uuidv4().replace(/-/g, "_")}`;

// Function to send TradingView formatted messages
const sendMessage = (msg) => {
  if (tvWs.readyState === WebSocket.OPEN) {
    tvWs.send(`~m~${msg.length}~m~${msg}`);
  }
};

// TradingView WebSocket Events
tvWs.on("open", () => {
  console.log("✅ Connected to TradingView WebSocket");

  // Authenticate (TradingView doesn't require a token, but we must send an empty auth message)
  sendMessage(JSON.stringify(["set_auth_token", ""]));

  // Create a session
  sendMessage(JSON.stringify(["chart_create_session", session, ""]));

  // Subscribe to forex symbols
  forexPairs.forEach((pair) => {
    sendMessage(JSON.stringify(["resolve_symbol", session, pair, ""]));
    sendMessage(JSON.stringify(["create_series", session, "s1", "1", pair, "1", {}]));
  });
});

tvWs.on("message", (data) => {
    console.log("message ==> ", data);
    
  const messages = data.toString().split("~m~").slice(1);

  messages.forEach((msg) => {
    try {
      const json = JSON.parse(msg.substring(msg.indexOf("{")));

      if (json.m === "timescale_update" && json.p && json.p[1]?.s) {
        Object.entries(json.p[1].s).forEach(([symbol, details]) => {
          const price = details?.v?.c?.[0];
          if (price) {
            const formattedData = { symbol, price: parseFloat(price).toFixed(4) };

            console.log("📊 Forex Update:", formattedData);

            // Send forex data to WebSocket clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "forexTokens", data: [formattedData] }));
              }
            });
          }
        });
      }
    } catch (error) {
      console.error("❌ Error parsing TradingView data:", error);
    }
  });
});

wss.on("connection", (ws) => {
  console.log("🔗 Client connected");
  ws.on("close", () => console.log("🔌 Client disconnected"));
});
