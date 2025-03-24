import express from "express";
import cors from "cors";
import userRoutes from "./router/users.routes.js";
import session from "cookie-session";
import "./passport.mjs"
import passport from "passport";
import { cryptoRoutes, signUpRoutes, logInRoutes, bodyParser, verifyCodeRoutes, adminRoutes, buyRoutes, getInfo, getUserWallet, favoriteTokensRouter, getUserOrders, sellRoutes, alertRouter, closeOrderRouter, orderHistoryRouter, liquidationRouter, getFavoriteRouter, getChartRouter, sendAlertsRouter, getUsersRouter } from "./router/index.routes.js";

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





// app.use("/api/users", userRoutes)
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
app.use("/api/users" , getUsersRouter);
app.use("/api/send-alerts", sendAlertsRouter);

// app.use("/api/auth" ,auth) 
app.use("/api", cryptoRoutes)

export { app };

