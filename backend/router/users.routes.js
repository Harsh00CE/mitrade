import { Router } from "express";
import axios from "axios";

const router = Router();

router.get("/",async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                lang:'en',
                per_page: 100,
                page: 1,
                sparkline: false,
                price_change_percentage: '1h'
            }
        });
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;