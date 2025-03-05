import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// const login = (email, password) => {
//   return axios.post(`${API_URL}/auth/login`, { email, password });
// };

// const register = (email, password) => {
//   return axios.post(`${API_URL}/users`, { email, password });
// };

// const getTrades = (token) => {
//   return axios.get(`${API_URL}/trades`, { headers: { Authorization: token } });
// };

// const placeTrade = (trade, token) => {
//   return axios.post(`${API_URL}/trades`, trade, { headers: { Authorization: token } });
// };

const getCryptos = () => {
  return axios.get(`${API_URL}/users`);
};

export default {
//   login,
//   register,
//   getTrades,
//   placeTrade,
  getCryptos, 
};