import bcryptjs from "bcryptjs";
const pass = await bcryptjs.hash("aaaa", 10);
console.log(pass)














// let leq = false;
// const checkForLiquidations = async (wss) => {
//     try {

//         // const usersWithOpenPositions = await UserModel.find()

//         const usersWithOpenPositions = await UserModel.find({
//             orderList: { $exists: true, $not: { $size: 0 } }
//         });
//         let pair = new Map();


//         for (const user of usersWithOpenPositions) {
//             const walletType = user.walletType;
//             let wallet;


//             if (walletType === "demo") {
//                 wallet = await DemoWalletModel.findById(user.demoWallet);
//             } else {
//                 wallet = await ActiveWalletModel.findById(user.activeWallet);
//             }


//             if (!wallet) continue;

//             if (wallet.available == 0) continue;

//             // Recalculate available balance based on current prices
//             const openOrders = await OpenOrdersModel.find({
//                 userId: user._id,
//                 status: "active"
//             });

//             // console.log("openOrders", openOrders.length);


//             let totalUnrealizedPL = 0;

//             for (const order of openOrders) {
//                 const currentPriceData = currentPrices.get(order.symbol);
//                 // console.log("Open currentPriceData => ", currentPriceData);

//                 if (!currentPriceData) continue;



//                 const currentPrice = parseFloat(currentPriceData.bid)


//                 // console.log("currentPrice", currentPrice);

//                 const entryValue = order.openingPrice
//                 const currentValue = currentPrice

//                 // console.log("enteryValue", entryValue , "currentValue", currentValue);


//                 const unrealizedPL = order.type === "buy"
//                     ? (currentValue - entryValue) * order.contractSize * order.quantity
//                     : (entryValue - currentValue) * order.contractSize * order.quantity;;

//                 // console.log("unrealized p/l => " , unrealizedPL);
//                 totalUnrealizedPL += unrealizedPL;



//                 pair.set(order.symbol, currentPrice);
//             }

//             console.log("total p/l => ", totalUnrealizedPL);

//             const available = parseFloat((wallet.available + totalUnrealizedPL).toFixed(2));
//             console.log("available ==> ", available);


//             if (available <= 0 && leq === false) {
//                 console.log("available -> ", available);
//                 leq = true;



//                 await liquidateAllPositions(user._id, wallet, wss, openOrders, pair);
//             } else {
//                 pair = new set();
//             }
//         }
//     } catch (error) {
//         console.error('Error in liquidation check:', error);
//     }
// };

// const liquidateAllPositions = async (userId, wallet, wss, openOrders, pair) => {


//     try {
//         const activeOrders = openOrders;

//         for (const order of activeOrders) {
//             // const currentPriceData = currentPrices.get(order.symbol);
//             // console.log("Close current price => ", currentPriceData);

//             // if (!currentPriceData) continue;

//             // const currentPrice = parseFloat(currentPriceData.bid);
//             // const currentPrice = pair.find(p => p.symbol === order.symbol).currentPrice;


//             const currentPrice = pair.get(order.symbol);
//             if (!currentPrice) continue;


//             const entryValue = order.openingPrice;
//             const currentValue = currentPrice

//             let realisedPL = order.type === "buy"
//                 ? (currentValue - entryValue) * order.contractSize * order.quantity
//                 : (entryValue - currentValue) * order.contractSize * order.quantity;

//             realisedPL = parseFloat(realisedPL.toFixed(2));
//             const closedOrder = new ClosedOrdersModel({
//                 originalOrderId: order._id,
//                 orderId: new mongoose.Types.ObjectId().toString(),
//                 userId: order.userId,
//                 symbol: order.symbol,
//                 contractSize: order.contractSize,
//                 type: order.type,
//                 quantity: order.quantity,
//                 openingPrice: order.openingPrice,
//                 closingPrice: currentPrice,
//                 leverage: order.leverage,
//                 status: "closed",
//                 position: "close",
//                 openingTime: order.openingTime,
//                 closingTime: new Date(),
//                 realisedPL,
//                 margin: order.margin,
//                 tradingAccount: order.tradingAccount || "demo",
//                 closeReason: "liquidation"
//             });
//             if (order.stopLoss.type) {
//                 closedOrder.stopLoss = order.stopLoss;
//             }

//             if (order.takeProfit.type) {
//                 closedOrder.takeProfit = order.takeProfit;
//             }


//             await closedOrder.save();

//             await OpenOrdersModel.findByIdAndDelete(order._id);

//             console.log("pair ==> ", pair);


//             wss.clients.forEach(client => {
//                 if (client.readyState === 1) {
//                     client.send(JSON.stringify({
//                         type: 'tradeClosed',
//                         data: {
//                             tradeId: order._id,
//                             symbol: order.symbol,
//                             price: currentPrice,
//                             reason: 'liquidation',
//                             realisedPL
//                         }
//                     }));
//                 }
//             });
//         }

//         wallet.balance = 0;
//         wallet.available = 0;
//         wallet.margin = 0;
//         wallet.equity = 0;
//         await wallet.save();

//         await UserModel.updateOne(
//             { _id: userId },
//             {
//                 $set: { openOrders: [] },
//                 $push: { closedOrders: { $each: activeOrders.map(o => o._id) } }
//             },
//         );

//         // console.log(`Successfully liquidated all positions for user ${userId}`);
//     } catch (error) {
//         console.error('Error during liquidation:', error);
//     }
// };



