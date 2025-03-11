import { Router } from "express";
import UserModel from "../schemas/userSchema";
import DemoWalletModel from "../schemas/demoWalletSchema";
import OrderModel from "../schemas/orderSchema";
// import userMiddlware from "../middleware/userMiddleware";

const orderRouter = Router();

orderRouter.post('/buy', /*userMiddlware,*/ async (req, res) => {
    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss, status } = req.body;

        if (!userId || !symbol || !quantity || !price || !leverage || !status) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: userId, symbol, quantity, price, leverage, takeProfit, stopLoss, status",
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        
        const demoWallet = await DemoWalletModel.findById(user.demoWallet._id);
        const marginRequired = (quantity * price) / leverage;

        if (demoWallet && demoWallet.available < marginRequired) {
            return res.status(400).json({
                success: false,
                message: "Insufficient available balance",
            });
        }

        demoWallet.available -= marginRequired;
        const orderId = uuidv4();
        const createOrderResponse = OrderModel.create({
            orderId,
            userId,
            symbol,
            type: "buy",
            quantity,
            price,
            leverage,
            takeProfit,
            stopLoss,
            margin: marginRequired,
            status: status,
            position: "open",
            openingTime: new Date(),
            tradingAccount: "demo",
        });
        

        user.orderList.push(createOrderResponse._id);

        await user.save();
        await demoWallet.save();
        return res.status(200).json({
            success: true,
            message: "Buy order placed successfully",
            createOrderResponse,
        });
    } catch (error) {
        console.error("Error placing buy order:", error);
        return res.status(500).json({
            success: false,
            message: "Error placing buy order",
        });
    }
});

orderRouter.post('/sell', /*userMiddlware,*/ async (req, res) => {
    try {
        const { userId, symbol, quantity, price, leverage, takeProfit, stopLoss, status } = req.body;

        if (!userId || !symbol || !quantity || !price || !leverage || !status) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: userId, symbol, quantity, price, leverage, takeProfit, stopLoss, status",
            });
        }

        const user = await UserModel.findById(userId);
        const demoWallet = await DemoWalletModel.findById(user.demoWallet._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const marginRequired = (quantity * price) / leverage;

        if (demoWallet.available < marginRequired) {
            return res.status(400).json({
                success: false,
                message: "Insufficient available balance",
            });
        }

        demoWallet.available -= marginRequired;
        
        const orderId = uuidv4();

        const order = OrderModel.create({
            orderId,
            userId,
            symbol,
            type: "sell", 
            quantity,
            price,
            leverage,
            takeProfit,
            stopLoss,
            margin: marginRequired,
            status: status,
            position: "open",
            openingTime: new Date(),
            tradingAccount: "demo",
        });
        
        await demoWallet.save();
        user.orderList.push(order._id);

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Sell order placed successfully",
            order,
        });
    } catch (error) {
        console.error("Error placing sell order:", error);
        return res.status(500).json({
            success: false,
            message: "Error placing sell order",
        });
    }
});

export default orderRouter;