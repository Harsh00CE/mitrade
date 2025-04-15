import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const closedOrdersSchema = new Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        originalOrderId: {
            type: String,
            required: true,
            index: true,
        },
        symbol: {
            type: String,
            required: true,
            index: true,
        },
        contractSize: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["buy", "sell"],
        },
        quantity: {
            type: Number,
            required: true,
            min: 0.0001,
        },
        openingPrice: {
            type: Number,
            required: true,
            min: 0.01,
        },
        closingPrice: {
            type: Number,
            required: true,
            min: 0.01,
        },
        leverage: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            required: true,
            enum: ["closed"],
            default: "closed",
        },
        position: {
            type: String,
            required: true,
            enum: ["close"],
            default: "close",
        },
        openingTime: {
            type: Date,
            required: true,
        },
        closingTime: {
            type: Date,
            required: true,
            default: Date.now,
        },

        takeProfit: Number,
        stopLoss: Number,
        // takeProfit: {
        //     type: {
        //         type: String,
        //         enum: ["price", "profit"],
        //         default: null,
        //     },
        //     value: {
        //         type: Number,
        //         default: null,
        //     }
        // },
        // stopLoss: {
        //     type: {
        //         type: String,
        //         enum: ["price", "loss"],
        //         default: null,
        //     },
        //     value: {
        //         type: Number,
        //         default: null,
        //     }
        // },
        trailingStop: {
            type: String,
            default: "Unset",
        },
        realisedPL: {
            type: Number,
            required: true,
        },
        overnightFunding: {
            type: Number,
            default: 0,
        },
        margin: {
            type: Number,
            required: true,
        },
        tradingAccount: {
            type: String,
            required: true,
            enum: ["demo", "live"],
            index: true,
        },
        overnightFunding: {
            type: Number,
            default: 0,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        closeReason: {
            type: String,
            enum: ["manual", "stop-loss", "take-profit", "trailing-stop", "liquidation", "other"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);


const ClosedOrdersModel = mongoose.models.ClosedOrders || mongoose.model("ClosedOrders", closedOrdersSchema);

export default ClosedOrdersModel;