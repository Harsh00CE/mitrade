import dotenv from "dotenv";
import mongoose from "mongoose";
import { WebSocket } from "ws";  // Make sure to import WebSocket
import { WebSocketServer } from "ws";
import { createServer } from 'http';
import UserModel from "./schemas/userSchema.js";
import OpenOrdersModel from "./schemas/openOrderSchema.js";
import ClosedOrdersModel from "./schemas/closeOrderSchema.js";
import DemoWalletModel from "./schemas/demoWalletSchema.js";
import ActiveWalletModel from "./schemas/activeWalletSchema.js";
import connectDB from "./ConnectDB/ConnectionDB.js";
import AlertModel from "./schemas/alertSchema.js";

dotenv.config({ path: ".env" });

// Configuration
const LIQUIDATION_SERVER_PORT = process.env.LIQUIDATION_PORT || 3002;
const LIQUIDATION_CHECK_INTERVAL = 100; // 5 seconds
const MAIN_SERVER_WS_URL = `ws://localhost:${process.env.SOCKET_PORT || 3001}`;

// Connect to MongoDB
await connectDB();

// Create HTTP server and WebSocket server
const server = createServer();
const wss = new WebSocketServer({ server });

// Current prices map (will be updated from main server)
const currentPrices = new Map();

// WebSocket connection from main server to receive price updates
let mainServerConnection = null;

function connectToMainServer() {
  try {
    console.log(`Attempting to connect to main server at ${MAIN_SERVER_WS_URL}`);
    const ws = new WebSocket(MAIN_SERVER_WS_URL);

    ws.on('open', () => {
      console.log('Connected to main price server');
      mainServerConnection = ws;

      // Send registration message to identify as liquidation server
      ws.send(JSON.stringify({
        type: 'register',
        role: 'liquidation-server'
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'priceUpdate') {
          currentPrices.set(message.data.instrument, message.data);
        } else if (message.type === 'allForexPrice' || message.type === 'allCryptoPrice') {
          message.data.forEach(priceData => {
            currentPrices.set(priceData.instrument, priceData);
          });
        }
      } catch (error) {
        console.error('Error processing price update:', error);
      }
    });

    ws.on('close', () => {
      console.log('Disconnected from main price server');
      mainServerConnection = null;
      setTimeout(connectToMainServer, 5000);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    });

  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    setTimeout(connectToMainServer, 5000);
  }
}

// Start connection to main server
connectToMainServer();

// Liquidation check interval
const liquidationInterval = setInterval(() => {
  checkForLiquidations(wss).catch(console.error);
}, LIQUIDATION_CHECK_INTERVAL);

// Cleanup on server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down liquidation server...');
  clearInterval(liquidationInterval);
  if (mainServerConnection) {
    mainServerConnection.close();
  }
  server.close(() => {
    process.exit(0);
  });
});

// Liquidation functions
const checkForLiquidations = async (wss) => {
  try {
    let pair = new Map();

    const openOrders = await OpenOrdersModel.find({
      status: "active", position: 'open'
    }).distinct("userId");


    if (!openOrders.length) {
      return;
    }

    const get_users_with_orders = await UserModel.find({
      _id: { $in: openOrders }
    }).populate("orderList demoWallet activeWallet");

    if (!get_users_with_orders.length) {
      return;
    }

    for (const single_user of get_users_with_orders) {
      let wallet, totalUnrealizedPL = 0;

      if (single_user.walletType === "demo") {
        wallet = single_user.demoWallet;
      } else {
        wallet = single_user.activeWallet;
      }

      if (!wallet) continue;
      if (wallet.available == 0) continue;

      if (!single_user.orderList.length) {
        continue;
      }

      for (const single_order of single_user.orderList) {
        const currentPriceData = currentPrices.get(single_order.symbol);

        if (!currentPriceData) continue;

        const currentPrice = parseFloat(currentPriceData.bid);
        const entryValue = single_order.openingPrice;
        const currentValue = currentPrice;

        const unrealizedPL = single_order.type === "buy"
          ? (currentValue - entryValue) * single_order.contractSize * single_order.quantity
          : (entryValue - currentValue) * single_order.contractSize * single_order.quantity;

        totalUnrealizedPL += unrealizedPL;
        pair.set(single_order.symbol, currentPrice);
      }

      const available = parseFloat((wallet.equity + totalUnrealizedPL).toFixed(2));
      const find_user = await UserModel.findById(single_user._id);
      const liquidationStatus = find_user.liquidated;


      console.log("available ==> ", available);


      if (available <= 0 && liquidationStatus === false) {
        await UserModel.updateOne(
          { _id: single_user._id },
          { $set: { liquidated: true } }
        );



        const { closedOrders, openOrdersToDelete, updatedWallet } =
          await liquidateAllPositions(single_user._id, wallet, wss, single_user.orderList, pair);

        await OpenOrdersModel.bulkWrite(openOrdersToDelete);
        await ClosedOrdersModel.bulkWrite(closedOrders);

        const walletModel = single_user.walletType === "demo" ? DemoWalletModel : ActiveWalletModel;
        await walletModel.updateOne(
          { userId: new mongoose.Types.ObjectId(single_user._id) },
          { $set: updatedWallet }
        );
      } else {
        pair.clear();
      }
    }
  } catch (error) {
    console.error('Error in liquidation check:', error);
  }
};

const liquidateAllPositions = async (userId, wallet, wss, openOrders, pair) => {
  try {
    const activeOrders = openOrders;
    let closedOrders = [];
    let openOrdersToDelete = [];
    let updatedWallet = {
      _id: wallet._id,
      balance: 0,
      equity: 0,
      available: 0,
      margin: 0,
    };

    for (const order of activeOrders) {
      const currentPrice = pair.get(order.symbol);
      if (!currentPrice) continue;

      const entryValue = order.openingPrice;
      const currentValue = currentPrice;

      let realisedPL = order.type === "buy"
        ? (currentValue - entryValue) * order.contractSize * order.quantity
        : (entryValue - currentValue) * order.contractSize * order.quantity;

      realisedPL = parseFloat(realisedPL.toFixed(2));

      const closedOrderDoc = {
        originalOrderId: order._id,
        orderId: new mongoose.Types.ObjectId().toString(),
        userId: userId,
        symbol: order.symbol,
        contractSize: order.contractSize,
        type: order.type,
        quantity: order.quantity,
        openingPrice: order.openingPrice,
        closingPrice: currentPrice,
        leverage: order.leverage,
        status: "closed",
        position: "close",
        openingTime: order.openingTime,
        closingTime: new Date(),
        realisedPL: realisedPL,
        margin: order.margin,
        tradingAccount: order.tradingAccount || "demo",
        closeReason: "liquidation"
      };

      if (order.stopLoss?.type) {
        closedOrderDoc.stopLoss = order.stopLoss;
      }

      if (order.takeProfit?.type) {
        closedOrderDoc.takeProfit = order.takeProfit;
      }

      closedOrders.push({
        insertOne: {
          document: closedOrderDoc
        }
      });

      openOrdersToDelete.push({
        deleteOne: {
          filter: { _id: order._id }
        }
      });

      // Notify clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'tradeClosed',
            data: {
              tradeId: order._id,
              symbol: order.symbol,
              price: currentPrice,
              reason: 'liquidation',
              realisedPL
            }
          }));
        }
      });
    }

    // Update user's order history
    await UserModel.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      {
        $set: { orderList: [] },
        $push: { orderHistory: { $each: activeOrders.map(o => o._id) } }
      }
    );

    return { closedOrders, openOrdersToDelete, updatedWallet };
  } catch (error) {
    console.error('Error during liquidation:', error);
    throw error;
  }
};

server.listen(LIQUIDATION_SERVER_PORT, () => {
  console.log(`Liquidation server running on port ${LIQUIDATION_SERVER_PORT}`);
});