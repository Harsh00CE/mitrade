import { app } from "./app.js";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import connectDB from "./ConnectDB/ConnectionDB.js";
import UserModel from "./schemas/userSchema.js";
import PairInfoModel from "./schemas/pairInfo.js"; 

dotenv.config({ path: ".env" });

await connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket server running on ws://192.168.0.103:8080");

const favoriteSubscriptions = new Map();
const adminTokens = new Set(); 

const loadAdminTokens = async () => {
    try {
        const pairs = await PairInfoModel.find({}, "symbol");
        adminTokens.clear();
        pairs.forEach((pair) => adminTokens.add(pair.symbol));
        // console.log("Admin tokens loaded:", Array.from(adminTokens));
    } catch (error) {
        console.error("Error loading admin tokens:", error);
    }
};

await loadAdminTokens();

wss.on("connection", async (ws) => {
    console.log("New client connected");

    ws.on("message", async (message) => {
        const data = JSON.parse(message);

        if (data.type == "subscribeFavorites") {
            const { userId } = data;
            // console.log("User ID:", userId);
            
            if (!userId) return;

            const user = await UserModel.findById(userId);
            if (!user) {
                console.log(`User ${userId} not found`);
                return;
            }

            const favoriteTokens = user.favoriteTokens || [];
            favoriteSubscriptions.set(userId, new Set(favoriteTokens));
            ws.userId = userId; 

            console.log(`User ${userId} subscribed to favorite tokens:`, favoriteTokens);
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

const binanceWs = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");

binanceWs.on("message", (data) => {
    const tickers = JSON.parse(data);

    const usdPairs = tickers.filter(ticker => ticker.s.endsWith('USDT'));

    const formattedTickers = usdPairs.map((ticker) => ({
        symbol: ticker.s,
        price: parseFloat(ticker.c).toFixed(4),
        volume: parseFloat(ticker.v).toFixed(2),
        change: parseFloat(ticker.P).toFixed(2),
    }));

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "allTokens", data: formattedTickers }));

            const userId = client.userId;
            
            if (userId && favoriteSubscriptions.has(userId)) {

                const favoriteTokens = favoriteSubscriptions.get(userId);
                const filteredData = formattedTickers.filter(t => favoriteTokens.has(t.symbol));
                
                if (filteredData.length > 0) {
                    client.send(JSON.stringify({ type: "favoriteTokens", data: filteredData }));
                }
            }

            const adminFilteredData = formattedTickers.filter(t => adminTokens.has(t.symbol));
            if (adminFilteredData.length > 0) {
                client.send(JSON.stringify({ type: "adminTokens", data: adminFilteredData }));
            }
        }
    });
});

setInterval(loadAdminTokens, 60000); 
