import { Router } from "express";
import { getCryptoData } from "../controllers/cryptoController.js";

const router = Router();

router.get("/", getCryptoData);

export default router;