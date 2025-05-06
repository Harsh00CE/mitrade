import express from "express";
import UserModel from "../schemas/userSchema.js";
import { v4 as uuidv4 } from 'uuid';
import OpenOrdersModel from "../schemas/openOrderSchema.js";
import DemoWalletModel from "../schemas/demoWalletSchema.js";
import ActiveWalletModel from "../schemas/activeWalletSchema.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss, contractSize, status, pendingValue, availableBalance, pairType } = req.body;

        if (!userId || !symbol || !quantity || !price || !leverage || !contractSize || !status || !availableBalance || !pairType) {
            return res.status(200).json({
                success: false,
                message: "Required fields: userId, symbol, quantity, price, leverage , contractSize , status , availableBalance and pairType",
            });
        }

        if (status === "pending" && pendingValue === undefined) {
            return res.status(200).json({
                success: false,
                message: "Pending order requires pendingValue",
            });
        }

        if (isNaN(quantity) || isNaN(price) || isNaN(leverage) ||
            quantity <= 0 || price <= 0 || leverage < 1) {
            return res.status(200).json({
                success: false,
                message: "Quantity and price must be positive numbers, leverage must be ≥1"
            });
        }

        const user = await UserModel.findById(userId)

        if (!user || !user.demoWallet) {
            return res.status(200).json({
                success: false,
                message: "User or wallet not found"
            });
        }

        if (!user.walletType) {
            return res.status(200).json({
                success: false,
                message: "User wallet type not found",
            })
        }

        if (!user.demoWallet && !user.activeWallet) {
            return res.status(200).json({
                success: false,
                message: "User wallet not found",
            })
        }

        const walletType = user.walletType;
        let wallet;

        if (walletType === "demo") {
            wallet = await DemoWalletModel.findById(user.demoWallet);
        } else {
            wallet = await ActiveWalletModel.findById(user.activeWallet);
        }


        const marginRequired = parseFloat(((quantity * price * contractSize) / leverage).toFixed(2));

        // region Change available value conditionally
        if (availableBalance < marginRequired) {

            // Fetch all active buy and sell orders for the user and symbol
            const [findSellOrder, findBuyOrder] = await Promise.all([
                OpenOrdersModel.find({ userId: user._id, symbol, type: "sell" }),
                OpenOrdersModel.find({ userId: user._id, symbol, status: "active", type: "buy" })
            ]);

            // Initialize quantities to 0
            let totalSellQuantity = 0;
            let totalBuyQuantity = quantity;

            // Sum quantities for sell orders
            findSellOrder.forEach(order => {
                totalSellQuantity += order.quantity;
            });

            // Sum quantities for buy orders
            findBuyOrder.forEach(order => {
                totalBuyQuantity += order.quantity;
            });

            if (totalSellQuantity < totalBuyQuantity) {

                const orderId = uuidv4();
                const getISTDate = () => {
                    const now = new Date();
                    const istOffset = 5.5 * 60;
                    return new Date(now.getTime() + istOffset * 60 * 1000);
                };

                function validateTPorSL(input, allowedTypes) {
                    if (
                        input &&
                        typeof input === 'object' &&
                        input.type &&
                        allowedTypes.includes(input.type) &&
                        input.value !== undefined &&
                        input.value !== '' &&
                        !isNaN(parseFloat(input.value))
                    ) {
                        return {
                            type: input.type,
                            value: parseFloat(input.value)
                        };
                    }
                    return null;
                }

                console.log("takeprofit", takeProfit);
                console.log("stoploss", stopLoss);


                let formattedTP = validateTPorSL(takeProfit, ['price', 'profit']);

                console.log("formattedtp", formattedTP);
                if (takeProfit && !formattedTP) {
                    return res.status(200).json({ success: false, message: "Invalid takeProfit format" });
                }

                let formattedSL = validateTPorSL(stopLoss, ['price', 'loss']);
                if (stopLoss && !formattedSL) {
                    return res.status(200).json({ success: false, message: "Invalid stopLoss format" });
                }


                if (takeProfit && typeof takeProfit === 'object' && takeProfit.type && takeProfit.value !== undefined) {
                    const allowedTypes = ['price', 'profit'];
                    if (!allowedTypes.includes(takeProfit.type) || isNaN(takeProfit.value)) {
                        return res.status(200).json({ success: false, message: "Invalid takeProfit format" });
                    }
                    formattedTP = {
                        type: takeProfit.type,
                        value: parseFloat(takeProfit.value)
                    };
                }

                // 🧠 Process stopLoss
                if (stopLoss && typeof stopLoss === 'object' && stopLoss.type && stopLoss.value !== undefined) {
                    const allowedTypes = ['price', 'loss'];
                    if (!allowedTypes.includes(stopLoss.type) || isNaN(stopLoss.value)) {
                        return res.status(200).json({ success: false, message: "Invalid stopLoss format" });
                    }
                    formattedSL = {
                        type: stopLoss.type,
                        value: parseFloat(stopLoss.value)
                    };
                }


                const order = new OpenOrdersModel({
                    orderId,
                    symbol,
                    contractSize,
                    type: "sell",
                    quantity: parseFloat(quantity),
                    openingPrice: parseFloat(price),
                    leverage: parseInt(leverage),
                    takeProfit: formattedTP,
                    stopLoss: formattedSL,
                    trailingStop: "Unset",
                    status: status,
                    pendingValue: pendingValue,
                    position: "open",
                    openingTime: getISTDate(),
                    margin: marginRequired,
                    tradingAccount: user.walletType,
                    userId,
                    pairType: pairType,
                });

                if (status == "active") {
                    const currentAvailable = parseFloat(wallet.available) || 0;
                    const currentMargin = parseFloat(wallet.margin) || 0;

                    if (availableBalance > marginRequired) {
                        wallet.available = parseFloat((currentAvailable - marginRequired).toFixed(2));
                        wallet.margin = parseFloat((currentMargin + marginRequired).toFixed(2));
                    } else if (availableBalance <= marginRequired && availableBalance > 0) {
                        marginRequired = parseFloat(availableBalance);
                        wallet.available = parseFloat((currentAvailable - marginRequired).toFixed(2));
                        wallet.margin = parseFloat((currentMargin + marginRequired).toFixed(2));
                    } else {
                        marginRequired = 0;
                        wallet.available = 0;
                    }

                }


                user.orderList.push(order.id);

                await Promise.all([order.save(), wallet.save(), user.save()]);

                return res.status(200).json({
                    success: true,
                    message: "Buy order placed successfully",
                    data: {
                        orderId,
                        symbol,
                        quantity,
                        price,
                        marginRequired,
                        openingTime: order.openingTime,
                        status: order.status,
                    }
                });


            } else {
                return res.status(200).json({
                    success: false,
                    message: `Insufficient balance. Required: ${marginRequired}, Available: ${availableBalance}`
                });
            }
        }

        const orderId = uuidv4();
        const getISTDate = () => {
            const now = new Date();
            const istOffset = 5.5 * 60;
            return new Date(now.getTime() + istOffset * 60 * 1000);
        };

        function validateTPorSL(input, allowedTypes) {
            if (
                input &&
                typeof input === 'object' &&
                input.type &&
                allowedTypes.includes(input.type) &&
                input.value !== undefined &&
                input.value !== '' &&
                !isNaN(parseFloat(input.value))
            ) {
                return {
                    type: input.type,
                    value: parseFloat(input.value)
                };
            }
            return null;
        }
        let formattedTP = validateTPorSL(takeProfit, ['price', 'profit']);



        if (takeProfit && !formattedTP) {
            return res.status(200).json({ success: false, message: "Invalid takeProfit format" });
        }

        let formattedSL = validateTPorSL(stopLoss, ['price', 'loss']);
        if (stopLoss && !formattedSL) {
            return res.status(200).json({ success: false, message: "Invalid stopLoss format" });
        }

        console.log("formattedtp", formattedTP);
        console.log("stoploss", formattedSL);

        // ✅ Format takeProfit if object
        // let formattedTP = null;
        if (takeProfit && typeof takeProfit === 'object' && takeProfit.type && takeProfit.value !== undefined) {
            const validTypes = ['price', 'profit'];
            if (!validTypes.includes(takeProfit.type) || isNaN(takeProfit.value)) {
                return res.status(200).json({
                    success: false,
                    message: "Invalid takeProfit format"
                });
            }
            formattedTP = {
                type: takeProfit.type,
                value: parseFloat(takeProfit.value)
            };
        }

        console.log("stoploss", stopLoss);
        console.log("takeprofit", takeProfit);



        // ✅ Format stopLoss if object
        // let formattedSL = null;
        if (stopLoss && typeof stopLoss === 'object' && stopLoss.type && stopLoss.value !== undefined) {
            const validTypes = ['price', 'loss'];
            if (!validTypes.includes(stopLoss.type) || isNaN(stopLoss.value)) {
                return res.status(200).json({
                    success: false,
                    message: "Invalid stopLoss format"
                });
            }
            formattedSL = {
                type: stopLoss.type,
                value: parseFloat(stopLoss.value)
            };
        }

        const order = new OpenOrdersModel({
            orderId,
            symbol,
            contractSize,
            type: "sell",
            quantity: parseFloat(quantity),
            openingPrice: parseFloat(price),
            leverage: parseInt(leverage),
            takeProfit: formattedTP,
            stopLoss: formattedSL,
            trailingStop: "Unset",
            status: status,
            pendingValue: pendingValue,
            position: "open",
            openingTime: getISTDate(),
            margin: marginRequired,
            tradingAccount: user.walletType,
            userId,
            pairType: pairType,
        });

        if (status === "active") {
            wallet.available = parseFloat((wallet.available - marginRequired).toFixed(2));
            wallet.margin = parseFloat((wallet.margin + marginRequired).toFixed(2));
        }

        // wallet.available = parseFloat((wallet.available - marginRequired).toFixed(2));
        // wallet.margin = parseFloat((wallet.margin + marginRequired).toFixed(2));

        user.orderList.push(order.id);

        await Promise.all([order.save(), wallet.save(), user.save()]);

        return res.status(200).json({
            success: true,
            message: "Sell order placed successfully",
            data: {
                orderId,
                symbol,
                quantity,
                price,
                marginRequired,
                openingTime: order.openingTime
            }
        });

    } catch (error) {
        console.error("Sell order error:", error.message);
        if (!res.headersSent) {
            res.status(200).json({
                success: false,
                message: "Failed to place sell order",
                error: error.message
            });
        }
    }
});



router.patch("/update-tp-sl", async (req, res) => {
    try {
        const { orderId, takeProfit, stopLoss } = req.body;

        if (!orderId) {
            return res.status(200).json({
                success: false,
                message: "Missing orderId",
            });
        }

        const order = await OpenOrdersModel.findOne({ orderId });

        if (!order) {
            return res.status(200).json({
                success: false,
                message: "Order not found",
            });
        }

        let updatedFields = {};

        // ✅ Handle takeProfit
        if (takeProfit) {
            if (
                typeof takeProfit === "object" &&
                takeProfit.type &&
                takeProfit.value !== undefined
            ) {
                const allowedTypes = ["price", "profit"];
                if (
                    !allowedTypes.includes(takeProfit.type) ||
                    isNaN(takeProfit.value)
                ) {
                    return res.status(200).json({
                        success: false,
                        message: "Invalid takeProfit format",
                    });
                }
                updatedFields.takeProfit = {
                    type: takeProfit.type,
                    value: parseFloat(takeProfit.value),
                };
            } else {
                return res.status(200).json({
                    success: false,
                    message: "Invalid takeProfit structure",
                });
            }
        }

        // ✅ Handle stopLoss
        if (stopLoss) {
            if (
                typeof stopLoss === "object" &&
                stopLoss.type &&
                stopLoss.value !== undefined
            ) {
                const allowedTypes = ["price", "loss"];
                if (
                    !allowedTypes.includes(stopLoss.type) ||
                    isNaN(stopLoss.value)
                ) {
                    return res.status(200).json({
                        success: false,
                        message: "Invalid stopLoss format",
                    });
                }
                updatedFields.stopLoss = {
                    type: stopLoss.type,
                    value: parseFloat(stopLoss.value),
                };
            } else {
                return res.status(200).json({
                    success: false,
                    message: "Invalid stopLoss structure",
                });
            }
        }

        if (Object.keys(updatedFields).length === 0) {
            return res.status(200).json({
                success: false,
                message: "No fields to update",
            });
        }

        await OpenOrdersModel.updateOne({ orderId }, { $set: updatedFields });

        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
            updated: updatedFields,
        });
    } catch (error) {
        console.error("Update TP/SL error:", error.message);
        return res.status(200).json({
            success: false,
            message: "Failed to update order",
            error: error.message,
        });
    }
});


export default router;
