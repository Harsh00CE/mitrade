import express from "express";
import connectDB from "../ConnectDB/ConnectionDB.js";
import AlertModel from "../schemas/alertSchema.js";
import UserModel from "../schemas/userSchema.js"; 

const router = express.Router();

// POST API to create an alert and add it to the user's alerts array
router.post("/", async (req, res) => {
    await connectDB();
    try {
        const { userId, symbol, alertPrice, alertType, frequency } = req.body;

        if (!userId || !symbol || !alertPrice || !alertType || !frequency) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: userId, symbol, alertPrice, alertType, frequency",
            });
        }

        const alert = await AlertModel.create({
            userId,
            symbol,
            alertPrice,
            alertType,
            frequency,
        });

        await UserModel.findByIdAndUpdate(userId, { $push: { alerts: alert._id } });

        return res.status(200).json({
            success: true,
            message: "Alert created successfully",
            data: alert,
        });
    } catch (error) {
        console.error("Error creating alert:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

// GET API to fetch all alerts for a user
router.get("/:userId", async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await UserModel.findById(userId).populate("alerts");

        if (!user || !user.alerts || user.alerts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No alerts found for this user",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Alerts fetched successfully",
            data: user.alerts,
        });
    } catch (error) {
        console.error("Error fetching user alerts:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

// DELETE API to remove an alert
router.delete("/:alertId", async (req, res) => {
    await connectDB();
    try {
        const { alertId } = req.params;

        if (!alertId) {
            return res.status(400).json({
                success: false,
                message: "Alert ID is required",
            });
        }

        const alert = await AlertModel.findByIdAndDelete(alertId);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found",
            });
        }

        await UserModel.findByIdAndUpdate(alert.userId, { $pull: { alerts: alertId } });

        return res.status(200).json({
            success: true,
            message: "Alert deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting alert:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

// PUT API to update an alert
router.put("/:alertId", async (req, res) => {
    await connectDB();
    try {
        const { alertId } = req.params;
        const { alertPrice, frequency } = req.body;

        if (!alertPrice && !frequency) {
            return res.status(400).json({
                success: false,
                message: "At least one field (alertPrice or frequency) is required for update",
            });
        }

        const updatedAlert = await AlertModel.findByIdAndUpdate(
            alertId,
            { $set: { alertPrice, frequency } },
            { new: true }
        );

        if (!updatedAlert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Alert updated successfully",
            data: updatedAlert,
        });
    } catch (error) {
        console.error("Error updating alert:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;
