import axios from "axios";
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
    try {


        const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
        const symbols = response.data.symbols;

        // Filter only active symbols trading against USDT
        const cryptoPairs = symbols
            .filter(symbol =>
                symbol.status === 'TRADING' &&
                symbol.quoteAsset === 'USDT' &&
                !symbol.symbol.includes('UP') &&
                !symbol.symbol.includes('DOWN')
            )
            .map(symbol => symbol.symbol.toLowerCase());

        return res.json(cryptoPairs);

    } catch (error) {
        console.error('Error fetching Binance exchange info:', error);
    }
});

export default router;