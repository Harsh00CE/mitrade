import express from "express";
import { getCryptoData } from "../controllers/cryptoController.js";

const router = express.Router();

router.get("/crypto", getCryptoData);

export default router;