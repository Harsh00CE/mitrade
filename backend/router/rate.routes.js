import express from "express";
import RateController from "../controllers/rateController.js";

const Raterouter = express.Router();

Raterouter.get("/all", RateController.GetRates);
Raterouter.get("/:currency", RateController.GetRate);   
Raterouter.put("/update", RateController.UpdateRate);


export default Raterouter;
