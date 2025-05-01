import WebSocket from 'ws';
import { emittoAll } from './controllers/socketConfig.js';
import { checkTP_SL_TriggersForBinance } from './controllers/utilsFuncs.js';



const startBinanceSocket = async () => {
    // const symbols = await PairInfoModel.find({ status: Status.ACTIVE }).select('symbol');

    const TOP_100_CRYPTO_PAIRS = [
        'btcusdt', 'ethusdt', 'bchusdt', 'ltcusdt', 'solusdt', 'dogusdt', 'usdthusd', 'gbpusd', 'eurusd', 'usdcad', 'nzdusd', 'usdcan', 'usdsek', 'usdtrx', 'usdzar'
    ];

    const streams = TOP_100_CRYPTO_PAIRS.map(s => `${s.toLowerCase()}@miniTicker`).join('/');

    const url = `wss://stream.binance.com:9443/stream?streams=${streams}&timeUnit=MICROSECOND`;
    const ws = new WebSocket(url);

    ws.on('open', () => {
        console.log('Connected to Binance WebSocket');
    });

    ws.on('message', async data => {
        const msg = JSON.parse(data);
        const ticker = msg.data;
        emittoAll({ emit: 'ticker_update', data: { ticker } });

        checkTP_SL_TriggersForBinance(ticker.s, ticker.c );
    });
    ws.on('error', err => {
        console.error('WebSocket error:', err);
    });
};

export { startBinanceSocket };