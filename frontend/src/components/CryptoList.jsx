import React, { useState, useEffect } from 'react';
import api from '../src/services/api';


function CryptoList() {
  const [cryptos, setCryptos] = useState([]);

  useEffect(() => {
    const fetchCryptos = async () => {
      const response = await api.getCryptos();
      console.log("cryptos => ", response.data);
      
      setCryptos(response.data);
    };
    fetchCryptos();
  }, []);

  return (
    <div>
      <h1>Cryptocurrency List</h1>
      <ul>
        {cryptos.map((crypto) => (
          <li key={crypto.id}>
            {crypto.name} - ${crypto.current_price} - {crypto.price_change_percentage_24h}%
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CryptoList;