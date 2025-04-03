import express from "express";
import cors from "cors";
import userRoutes from "./router/users.routes.js";
import session from "cookie-session";
import "./passport.mjs"
import rateLimit from "express-rate-limit";
import passport from "passport";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from 'redis';
import { cryptoRoutes, signUpRoutes, logInRoutes, bodyParser, verifyCodeRoutes, adminRoutes, buyRoutes, getInfo, getUserWallet, favoriteTokensRouter, getUserOrders, sellRoutes, alertRouter, closeOrderRouter, orderHistoryRouter, liquidationRouter, getFavoriteRouter, getChartRouter, sendAlertsRouter, getUsersRouter, configWallet, kycRoutes, forgorPasswordRoutes, updartePasswordRoutes } from "./router/index.routes.js";
import authMiddleware from "./middleware/auth.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(bodyParser.json());
app.use(cors());

// const limiter = rateLimit({
//     max: 200,
//     windowMs: 60 * 60 * 1000,
//     message: "Too many request from this IP"
// });

// app.use(limiter);

app.use(
    session({
        name: "google-auth-session",
        keys: ["key1", "key2"],
        maxAge: 24 * 60 * 60 * 1000,
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.get(
    "/auth",
    passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get("/auth/callback",
    passport.authenticate("google", { failureRedirect: "/auth/callback/failure" }),
    (req, res) => {
        console.log("User authenticated:", req.user);
        res.redirect(`http://${process.env.SERVER_URL}:5173/`);
    }
);

// app.get("/user", (req, res) => {
//     res.json(req.user || null);
// });

// app.get("/logout", (req, res) => {
//     req.logout((err) => {
//         if (err) console.error(err);
//         req.session = null;
//         res.redirect(`http://${process.env.SERVER_URL}:5173/`);
//     });
// });





// app.use("/api/users", userRoutes)
app.use("/api/buy", buyRoutes)
app.use("/api/sell", sellRoutes)
app.use("/api/signup", signUpRoutes)
app.use("/api/login", logInRoutes)
app.use("/api/varify-code", verifyCodeRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/pair-info", getInfo)
app.use("/api/favoriteTokens", favoriteTokensRouter);
app.use("/api/user-orders", getUserOrders)
app.use("/api/alerts", alertRouter);
app.use("/api/close-order", closeOrderRouter);
app.use("/api/order-history", orderHistoryRouter);
app.use("/api/liquidation", liquidationRouter);
app.use("/api/get-favorite", getFavoriteRouter);
app.use("/api/chart", getChartRouter);
app.use("/api/users", getUsersRouter);
app.use("/api/send-alerts", sendAlertsRouter);
app.use("/api/userwallet",authMiddleware , getUserWallet)
app.use("/api/configwallet", configWallet);
app.use("/api/KYC", kycRoutes);
app.use("/api/forgot-password", forgorPasswordRoutes);
app.use("/api/update-password", updartePasswordRoutes);
// app.use("/api/auth" ,auth) 
app.use("/api", cryptoRoutes)

export { app };

