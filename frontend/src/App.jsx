import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login/Login.jsx";
import Dashboard from "./Pages/Dashboard/Dashboard.jsx";
import Comodity from "./Pages/Comodity/Comodity.jsx";
import Forex from "./Pages/Forex/Forex.jsx";
import User from "./Pages/Users/User.jsx";
import AdminPage from "./Pages/Admin/AdminPage.jsx";
import CandlestickChart from "./Pages/Chart/ChartPage.jsx";
import WalletConfigPage from "./Pages/WalletConfigPage/WalletConfigPage.jsx";
import LoginPage from "./Pages/LoginPage.jsx";
import Sidebar from "./components/Sidebar/Sidebar.jsx";


function App() {
  return (
    <Router>
      <div className="flex">
      <Sidebar />
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/forex" element={<Forex />} />
        <Route path="/users" element={<User/>} />
        {/* <Route path="/dashboard" element={<Comodity />} /> */}
        <Route path="/candlestick/:symbol" element={<CandlestickChart />} />
        <Route path="/admin/:symbol" element={<AdminPage />} />
        <Route path="/user-config/:userId" element={<WalletConfigPage />} />
        {/* <Route path="/" element={<LoginPage />} /> */}
      </Routes>
      </div>
    </Router>
  );
}

export default App;