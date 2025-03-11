import express from "express";
import cors from "cors";
import userRoutes from "./router/users.routes.js";
import session from "cookie-session";
import cryptoRoutes from "./router/cryptoRoutes.routes.js";
import bodyParser from "body-parser";
import "./passport.mjs"
import passport from "passport";

import adminRouter from "./router/admin.routes.js";
import orderRouter from "./router/order.routes.js";
import authRouter from "./router/auth.routes.js";

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
  
app.use("/api/auth", authRouter); // login, signup, goole A0uth, etc.
app.use("/api/users", userRoutes);
app.use("/api/order", orderRouter); // sell and buy order requests
app.use("/api/admin", adminRouter);
app.use("/api/crypto", cryptoRoutes);

export { app };

