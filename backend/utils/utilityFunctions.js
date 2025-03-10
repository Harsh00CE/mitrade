import OrderModel from "../schemas/orderSchema.js";
import TransactionModel from "../schemas/transactionSchema.js";
import UserModel from "../schemas/userSchema.js";

const calculateBalance = async (userId) => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const transactions = await TransactionModel.find({ userId });

        let balance = user.demoWallet.initialBalance || 50000;

        for (const transaction of transactions) {
            switch (transaction.type) {
                case "deposit":
                    balance += transaction.amount;
                    break;
                case "withdrawal":
                    balance -= transaction.amount;
                    break;
                case "realizedPL":
                    balance += transaction.amount;
                    break;
                case "adjustment":
                    balance += transaction.amount;
                    break;
                default:
                    break;
            }
        }

        user.demoWallet.balance = balance;
        await user.save();

        return balance;
    } catch (error) {
        console.error("Error calculating balance:", error);
        throw error;
    }
};

const calculateEquity = async (userId) => {
    try {
        const user = await UserModel.findById(userId).populate("demoWallet");
        
        if (!user) {
            throw new Error("User not found");
        }

        const currentBalance = user.demoWallet.balance;

        const openPositions = await OrderModel.find({
            userId,
            position: "open",
        });

        let unrealizedPL = 0;
        let overnightFees = 0;

        for (const position of openPositions) {
            const currentPrice = await getCurrentPrice(position.symbol);

            if (position.type === "buy") {
                unrealizedPL += (currentPrice - position.price) * position.quantity;
            } else if (position.type === "sell") {
                unrealizedPL += (position.price - currentPrice) * position.quantity;
            }

            overnightFees += position.overnightFunding || 0;
        }

        const equity = currentBalance + unrealizedPL + overnightFees;

        user.demoWallet.equity = equity;
        await user.demoWallet.save();

        return equity;
    } catch (error) {
        console.error("Error calculating equity:", error);
        throw error;
    }
};


const calculateAvailableBalance = async (userId) => {
    try {
        const user = await UserModel.findById(userId).populate("demoWallet");
        if (!user) {
            throw new Error("User not found");
        }
        const currentBalance = user.demoWallet.balance;

        const openPositions = await OrderModel.find({
            userId,
            position: "open",
        });

        const depositTransactions = await TransactionModel.find({
            userId,
            type: { $in: ["deposit", "withdrawal"] },
        });

        let depositBalance = 0;
        for (const transaction of depositTransactions) {
            if (transaction.type === "deposit") {
                depositBalance += transaction.amount;
            } else if (transaction.type === "withdrawal") {
                depositBalance -= transaction.amount;
            }
        }

        let unrealizedPL = 0;
        let overnightFees = 0;
        let totalInitialMargin = 0;

        for (const position of openPositions) {
            const currentPrice = await getCurrentPrice(position.symbol);

            if (position.type === "buy") {
                unrealizedPL += (currentPrice - position.price) * position.quantity;
            } else if (position.type === "sell") {
                unrealizedPL += (position.price - currentPrice) * position.quantity;
            }

            overnightFees += position.overnightFunding || 0;
            totalInitialMargin += position.margin;
        }

        const availableBalance = currentBalance + unrealizedPL - overnightFees - totalInitialMargin;

        user.demoWallet.available = availableBalance;
        await user.demoWallet.save();

        return availableBalance;
    } catch (error) {
        console.error("Error calculating available balance:", error);
        throw error;
    }
};






const getCurrentPrice = async (symbol) => {
    try {
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        return parseFloat(response.data.price);
    } catch (error) {
        console.error("Error fetching current price:", error);
        throw error;
    }
};



export { calculateBalance, calculateEquity, calculateAvailableBalance }; 
