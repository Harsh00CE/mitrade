import express from "express";
import cors from "cors";
import userRoutes from "./router/users.routes.js";
import session from "cookie-session";
import cryptoRoutes from "./router/cryptoRoutes.routes.js";
import signUpRoutes from "./router/signup.routes.js";
import logInRoutes from "./router/login.routes.js";
import bodyParser from "body-parser";
import verifyCodeRoutes from "./router/verify-code.routes.js";
import "./passport.mjs"
import passport from "passport";
import adminRoutes from "./router/admin.routes.js";
import buyRoutes from "./router/buy.routes.js";
import getInfo from "./router/getInfo.routes.js";
import getUserWallet from "./router/getWallet.routes.js";
import favoriteTokensRouter from "./router/favorite.routes.js"
import getUserOrders from "./router/order.routes.js"
import sellRoutes from "./router/sell.routes.js"
import alertRouter from "./router/alert.routes.js"
import closeOrderRouter from "./router/closeOrder.routes.js"
import orderHistoryRouter from "./router/orderHistory.routes.js"
import liquidationRouter from "./router/liquidation.routes.js"
import getFavoriteRouter from "./router/getFavorite.routes.js"
import getChartRouter from "./router/getChart.routes.js"
import sendAlertsRouter from "./router/sendEmailAlert.routes.js"

const app = express();
app.use(bodyParser.json());
app.use(cors());


app.use(
    session({
        name: "google-auth-session",
        keys: ["key1", "key2"],
        maxAge: 24 * 60 * 60 * 1000,
    })
);
app.use(passport.initialize());
app.use(passport.session());


app.get(
    "/auth",
    passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get("/auth/callback",
    passport.authenticate("google", { failureRedirect: "/auth/callback/failure" }),
    (req, res) => {
      console.log("User authenticated:", req.user);
      res.redirect("http://192.168.0.103:5173/");
    }
  );
  
app.get("/user", (req, res) => {
    res.json(req.user || null);
});

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) console.error(err);
        req.session = null;
        res.redirect("http://192.168.0.103:5173");
    });
});





app.use("/api/users", userRoutes)
app.use("/api/buy", buyRoutes)
app.use("/api/sell", sellRoutes)
app.use("/api/signup", signUpRoutes)
app.use("/api/login", logInRoutes)
app.use("/api/varify-code", verifyCodeRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/pair-info", getInfo)
app.use("/api/user-wallet",getUserWallet)
app.use("/api/favorite-tokens", favoriteTokensRouter);
app.use("/api/user-orders", getUserOrders)
app.use("/api/alerts", alertRouter);
app.use("/api/close-order", closeOrderRouter);
app.use("/api/order-history", orderHistoryRouter);
app.use("/api/liquidation", liquidationRouter);
app.use("/api/get-favorite", getFavoriteRouter);
app.use("/api/chart", getChartRouter);
app.use("/api/send-alerts", sendAlertsRouter);

// app.use("/api/auth" ,auth) 
app.use("/api", cryptoRoutes)

export { app };

