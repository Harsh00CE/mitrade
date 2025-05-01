import mongoose from "mongoose";
import ClosedOrdersModel from "../schemas/closeOrderSchema.js";
import OpenOrdersModel from "../schemas/openOrderSchema.js";
import UserModel from "../schemas/userSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";
import { emitToRoom } from "./socketConfig.js";

const checkTP_SL_TriggersForBinance = async (symbol, currentPrice) => {
    // Convert Binance symbol format (BTCUSDT) to our format (BTC_USD)
    // const formattedSymbol = symbol.replace('USDT', '_USD');
    const formattedSymbol = symbol.toLowerCase();

    // console.log("checkTP_SL_TriggersForBinance", formattedSymbol, currentPrice);



    const activeTrades = await OpenOrdersModel.find({
        symbol: formattedSymbol,
        status: "active",
        pairType: "crypto"
    });

    // console.log("activeTrades", activeTrades);


    for (const trade of activeTrades) {
        const { _id, userId, takeProfit, stopLoss, type, openingPrice, quantity, contractSize } = trade;
        let isTP = false, isSL = false;

        const entryValue = openingPrice * quantity;
        const currentValue = currentPrice * quantity;
        const profitOrLoss = type === "buy"
            ? (currentValue - entryValue) * contractSize
            : (entryValue - currentValue) * contractSize;

        if (takeProfit && takeProfit.value !== null) {
            if (takeProfit.type === 'price') {
                if ((type === 'buy' && currentPrice >= takeProfit.value) ||
                    (type === 'sell' && currentPrice <= takeProfit.value)) {
                    isTP = true;
                }
            } else if (takeProfit.type === 'profit') {
                if (profitOrLoss >= takeProfit.value) {
                    isTP = true;
                }
            }
        }



        if (stopLoss && stopLoss.value !== null) {
            if (stopLoss.type === 'price') {
                if ((type === 'buy' && currentPrice <= stopLoss.value) ||
                    (type === 'sell' && currentPrice >= stopLoss.value)) {
                    isSL = true;
                }
            } else if (stopLoss.type === 'loss') {
                if (profitOrLoss <= -Math.abs(stopLoss.value)) {
                    isSL = true;
                }
            }
        }

        console.log("symbol", symbol, "currentPrice", currentPrice, "isTP", isTP, "isSL", isSL);

        if (!isTP && !isSL) continue;

        const openOrder = await OpenOrdersModel.findOneAndDelete({ _id, status: "active" }).lean();

        if (!openOrder) continue;

        const closingValue = currentPrice * openOrder.quantity;
        let realisedPL = openOrder.type === "buy"
            ? closingValue - entryValue
            : entryValue - closingValue;

        realisedPL = parseFloat((realisedPL * openOrder.contractSize).toFixed(2));

        const closedOrder = new ClosedOrdersModel({
            originalOrderId: _id,
            orderId: new mongoose.Types.ObjectId().toString(),
            userId: openOrder.userId,
            symbol: openOrder.symbol,
            contractSize: openOrder.contractSize,
            type: openOrder.type,
            quantity: openOrder.quantity,
            openingPrice: openOrder.openingPrice,
            closingPrice: currentPrice,
            leverage: openOrder.leverage,
            status: "closed",
            position: "close",
            openingTime: openOrder.openingTime,
            closingTime: new Date(),
            realisedPL,
            margin: openOrder.margin,
            tradingAccount: openOrder.tradingAccount || "demo",
            closeReason: isTP ? "take-profit" : "stop-loss",
            pairType: 'crypto'
        });

        if (openOrder.stopLoss?.type) {
            closedOrder.stopLoss = openOrder.stopLoss;
        }

        if (openOrder.takeProfit?.type) {
            closedOrder.takeProfit = openOrder.takeProfit;
        }

        const user = await UserModel.findById(openOrder.userId);
        if (!user) continue;

        const walletType = user.walletType;
        let wallet;

        if (walletType === "demo") {
            wallet = await DemoWalletModel.findById(user.demoWallet);
        } else {
            wallet = await ActiveWalletModel.findById(user.activeWallet);
        }

        if (!wallet) continue;

        wallet.balance = parseFloat((wallet.balance + realisedPL).toFixed(2));
        wallet.available = parseFloat((wallet.available + realisedPL + openOrder.margin).toFixed(2));
        wallet.margin = parseFloat((wallet.margin - openOrder.margin).toFixed(2));
        wallet.equity = parseFloat((wallet.equity + realisedPL).toFixed(2));

        await Promise.all([
            closedOrder.save(),
            wallet.save(),
            UserModel.updateOne(
                { _id: openOrder.userId },
                {
                    $push: { closedOrders: closedOrder.orderId },
                    $pull: { openOrders: _id }
                }
            )
        ]);

        // wss.clients.forEach(client => {
        //     if (client.readyState === 1) {
        //         client.send(JSON.stringify({
        //             type: 'tradeClosed',
        //             data: {
        //                 tradeId: _id,
        //                 symbol: formattedSymbol,
        //                 price: currentPrice,
        //                 reason: isTP ? 'TP' : 'SL',
        //                 realisedPL,
        //                 pairType: 'crypto'
        //             }
        //         }));
        //     }
        // });

        emitToRoom({
            to: user._id.toString(),
            emit: "tradeClosed",
            data: {
                tradeId: _id,
                symbol: formattedSymbol,
                price: currentPrice,
                reason: isTP ? 'TP' : 'SL',
                realisedPL,
                pairType: 'crypto'
            }
        });

        console.log(`Closed Binance Order: ${formattedSymbol} @ ${currentPrice} for ${isTP ? "TP" : "SL"}`);
    }
};


export { checkTP_SL_TriggersForBinance };