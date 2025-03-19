import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  List,
  Coins,
  History,
  Banknote,
  Wallet,
  FileText,
  ShieldCheck,
} from "lucide-react";

const Sidebar = () => {
  const [active, setActive] = useState("Tokens List");

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },
    { name: "Users", icon: <Users />, path: "/users" },
    { name: "Coin Settings", icon: <Coins />, path: "/coin-settings" },
    { name: "Tokens List", icon: <List />, path: "/list" },
    { name: "Commission Settings", icon: <Settings />, path: "/commission-settings" },
    { name: "Trade History", icon: <History />, path: "/trade-history" },
    { name: "Commission History", icon: <History />, path: "/commission-history" },
    { name: "Fees Collected", icon: <Banknote />, path: "/fees-collected" },
    { name: "Reports", icon: <FileText />, path: "/reports" },
    { name: "User Deposit History", icon: <Banknote />, path: "/user-deposit-history" },
    { name: "User Withdraw History", icon: <Banknote />, path: "/user-withdraw-history" },
    { name: "Admin Wallet", icon: <Wallet />, path: "/admin-wallet" },
    { name: "Withdraw Wallet", icon: <Wallet />, path: "/withdraw-wallet" },
    { name: "KYC Submit", icon: <ShieldCheck />, path: "/kyc-submit" },
    { name: "Admin Bank", icon: <Banknote />, path: "/admin-bank" },
  ];

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-yellow-400 to-yellow-600 text-white p-4 flex flex-col">
      <div className="mb-6 p-4 text-white">
        <h2 className="text-lg font-bold">Super Admin</h2>
        <p className="text-sm">superadmin@erax.biz</p>
      </div>

      {/* Scrollable Menu */}
      <ul className="space-y-2 flex-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <li key={index}>
            <Link
              to={item.path}
              onClick={() => setActive(item.name)}
              className={`flex items-center space-x-3 p-3 rounded-md transition-all duration-300 ${
                active === item.name ? "bg-white text-yellow-600 font-semibold" : "hover:bg-yellow-500"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
