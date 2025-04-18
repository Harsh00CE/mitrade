import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./Pages/Login/Login.jsx";
import Dashboard from "./Pages/Dashboard/Dashboard.jsx";
import Comodity from "./Pages/Comodity/Comodity.jsx";
import Forex from "./Pages/Forex/Forex.jsx";
import Crypto from "./Pages/Crypto/Crypto.jsx";
import User from "./Pages/Users/User.jsx";
import AdminPage from "./Pages/Admin/AdminPage.jsx";
import WalletConfigPage from "./Pages/WalletConfigPage/WalletConfigPage.jsx";
import LoginPage from "./Pages/LoginPage.jsx";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import TradingViewChart from "./Pages/Chart/TradingViewChart.jsx";
import AdminLogin from "./Pages/AdminLogin/AdminLogin.jsx";
import AdminRegister from "./Pages/AdminRegister/AdminRegister.jsx";
import ProtectedRoute from "./routes/PrivateRoute.jsx";
import BuyHistory from "./Pages/BuyHistory/BuyHistory.jsx";
import SellHistory from "./Pages/SellHistory/SellHistory.jsx";
import WithdrawReport from "./Pages/WithdrawReport/WithdrawReport.jsx";
import DepositReport from "./Pages/DepositReport/DepositReport.jsx";
import KYCManagement from "./Pages/KYCManagement/KYCManagement.jsx";
import AdminBankForm from "./Pages/BankDetails/AdminBankForm.jsx";
import ApprovedDeposits from "./Pages/DepositReport/ApprovedDeposits.jsx";
import RejectedDeposits from "./Pages/DepositReport/RejectedDeposits.jsx";
import WithdrawApproved from "./Pages/WithdrawReport/WithdrawApproved.jsx";
import WithdrawRejected from "./Pages/WithdrawReport/WithdrawRejected.jsx";

const Layout = ({ children }) => {
  const location = useLocation();

  const hideSidebar = location.pathname.includes("/chart/") || location.pathname === "/login";

  return (
    <div className="flex">
      {!hideSidebar && <Sidebar />}
      <div className="flex-1">{children}</div>
    </div>
  );
};

function App() {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Router>
        <Routes>
          <Route path="/chart/:symbol" element={<TradingViewChart />} />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/login" element={<AdminLogin />} />
                  <Route path="/admin-register" element={<AdminRegister />} />

                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/crypto"
                    element={
                      <ProtectedRoute>
                        <Crypto />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/comodity"
                    element={
                      <ProtectedRoute>
                        <Comodity />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forex"
                    element={
                      <ProtectedRoute>
                        <Forex />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute>
                        <User />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/:symbol"
                    element={
                      <ProtectedRoute>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/user-config/:userId"
                    element={
                      <ProtectedRoute>
                        <WalletConfigPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/buy-history" element={
                    <ProtectedRoute>
                      <BuyHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/sell-history" element={
                    <ProtectedRoute>
                      <SellHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/deposit-pandding" element={
                    <ProtectedRoute>
                      <DepositReport />
                    </ProtectedRoute>
                  } />
                  <Route path="/deposit-approved" element={
                    <ProtectedRoute>
                      <ApprovedDeposits />
                    </ProtectedRoute>
                  } />
                  <Route path="/deposit-rejected" element={
                    <ProtectedRoute>
                      <RejectedDeposits />
                    </ProtectedRoute>
                  } />
                  <Route path="/withdraw-pandding" element={
                    <ProtectedRoute>
                      <WithdrawReport />
                    </ProtectedRoute>
                  } />
                  <Route path="/withdraw-approved" element={
                    <ProtectedRoute>
                      <WithdrawApproved />
                    </ProtectedRoute>
                  } />
                  <Route path="/withdraw-rejected" element={
                    <ProtectedRoute>
                      <WithdrawRejected />
                    </ProtectedRoute>
                  } />
                  <Route path="/kyc-submit" element={
                    <ProtectedRoute>
                      <KYCManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin-bank-details" element={
                    <ProtectedRoute>
                      <AdminBankForm />
                    </ProtectedRoute>
                  } />
                  {/* <Route path="/forex" element={<Forex />} />
                <Route path="/users" element={<User />} />
                <Route path="/admin/:symbol" element={<AdminPage />} />
                <Route path="/user-config/:userId" element={<WalletConfigPage />} /> */}
                  <Route path="*" element={<div className="text-center text-black text-xl mt-20">404 - Page Not Found</div>} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
