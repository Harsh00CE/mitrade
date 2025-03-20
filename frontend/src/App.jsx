import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../Pages/Login/Login";
import Dashboard from "../Pages/Dashboard/Dashboard";
import CandlestickChart from "../Pages/Chart/ChartPage";
import LoginPage from "../Pages/LoginPage";
import AdminPage from "../Pages/Admin/AdminPage";
import Comodity from "../Pages/Comodity/Comodity";
import Forex from "../Pages/Forex/Forex";
import Sidebar from "./components/Sidebar/Sidebar.jsx";



function App() {
  return (
    <Router>
      <div className="flex">
      <Sidebar />
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}
        <Route path="/crypto" element={<Dashboard />} />
        <Route path="/forex" element={<Forex />} />
        {/* <Route path="/dashboard" element={<Comodity />} /> */}
        <Route path="/candlestick/:symbol" element={<CandlestickChart />} />
        <Route path="/admin/:symbol" element={<AdminPage />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
      </div>
    </Router>
  );
}

export default App;