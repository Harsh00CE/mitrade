import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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
import TradingViewChart from "./Pages/Chart/TradingViewChart.jsx";
import ForexTable from "./Pages/Forex/ForexTable.jsx";

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Hide Sidebar only on TradingViewChart route
  const hideSidebar = location.pathname.startsWith("/chart/");

  return (
    <div className="flex">
      {!hideSidebar && <Sidebar />}
      <div className="flex-1">{children}</div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/chart/:symbol" element={<TradingViewChart />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/crypto" element={<Dashboard />} />
                <Route path="/forex" element={<Forex />} />
                {/* <Route path="/forex" element={<ForexTable />} /> */}
                <Route path="/users" element={<User />} />
                <Route path="/admin/:symbol" element={<AdminPage />} />
                <Route path="/user-config/:userId" element={<WalletConfigPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
