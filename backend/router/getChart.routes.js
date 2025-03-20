import express from "express";

const router = express.Router();

router.get("/:symbol", (req, res) => {
    const symbol = req.params.symbol;

    const formattedSymbol = `BINANCE:${symbol}`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TradingView Chart - ${symbol}</title>
        <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
    </head>
    <body>
        <div id="tradingview-chart" style="width: 100%; height: 100vh;">CHART</div>
        <script type="text/javascript">
            new TradingView.widget({
                width: "100%",
                height: 900,
                symbol: "${formattedSymbol}",
                interval: "D",
                timezone: "Etc/UTC",
                theme: "dark", 
                style: "1",
                locale: "en",
                toolbar_bg: "#1e1e1e", 
                enable_publishing: false,
                allow_symbol_change: true,
                container_id: "tradingview-chart",
                // studies: [
                //     "MACD@tv-basicstudies",
                //     "RSI@tv-basicstudies",
                //     "KDJ@tv-basicstudies",
                //     "ATR@tv-basicstudies",
                //     "MAExp@tv-basicstudies", 
                //     "BB@tv-basicstudies",   
                // ],
            });
        </script>
    </body>
    </html>
    `;

    res.send(html);
});

export default router;