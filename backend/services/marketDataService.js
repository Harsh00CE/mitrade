import ccxt from 'ccxt';

const getMarketData = async (exchangeId, symbol) => {
    const exchange = new ccxt[exchangeId]();
    return exchange.fetchTicker(symbol);
};
export {
    getMarketData
}