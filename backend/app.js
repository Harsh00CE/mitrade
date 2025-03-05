import express from "express";
import cors from "cors";
import userRoutes from "./router/users.routes.js";
import auth from "./router/auth.routes.js";
import cryptoRoutes from "./router/cryptoRoutes.routes.js";
import bodyParser from "body-parser";


const app = express();
app.use(bodyParser.json());
app.use(cors());


app.use("/api/users" ,userRoutes)
// app.use("/api/auth" ,auth) 
app.use("/api" ,cryptoRoutes)

export { app };

