import axios from "axios";


export const getCryptoData = async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false"
    );
    res.json(response.data);
  } catch (err) {
    res.status(200).json({ error: err.message });
  }
};