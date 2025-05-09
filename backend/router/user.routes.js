import express from "express";
import { get_wallet_data } from "../controllers/userController.js";

const Userrouter = express.Router();

Userrouter.get("/get_wallet_data/:userId", get_wallet_data);

export default Userrouter;
