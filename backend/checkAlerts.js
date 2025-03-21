import { sendVerificationEmail } from "./helpers/sendAlertEmail.js";
import AlertModel from "./schemas/alertSchema.js";
import UserModel from "./schemas/userSchema.js";


const checkAlerts = async (symbol, price) => {
    const alerts = await AlertModel.find({ symbol, isTriggered: false });

    for (const alert of alerts) {
        const shouldTrigger =
            (alert.alertType === "buy" && price <= alert.alertPrice) ||
            (alert.alertType === "sell" && price >= alert.alertPrice);

        if (shouldTrigger) {
            // Fetch the user to get their email
            const user = await UserModel.findById(alert.userId);
            if (!user) {
                console.error("User not found for alert:", alert._id);
                continue;
            }

            // Send an email to the user
            const emailSubject = `Alert Triggered: ${symbol} ${alert.alertType} at ${price}`;
            const emailText = `Your ${alert.alertType} alert for ${symbol} at ${alert.alertPrice} has been triggered. Current price: ${price}.`;

            const emailSent = await sendVerificationEmail(user.email, emailSubject, emailText);

            if (emailSent) {
                console.log(`Email sent to ${user.email} for alert ${alert._id}`);
            } else {
                console.error(`Failed to send email for alert ${alert._id}`);
            }

            if (alert.frequency === "onlyOnce") {
                alert.isTriggered = true;
            } else if (alert.frequency === "onceADay") {
                const today = new Date();
                if (!alert.lastTriggeredDate || alert.lastTriggeredDate.toDateString() !== today.toDateString()) {
                    alert.lastTriggeredDate = today;
                } else {
                    continue; 
                }
            }

            await alert.save();
        }
    }
};

export default checkAlerts;