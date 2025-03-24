import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  Coins,
  History,
  Banknote,
  Wallet,
  FileText,
  ShieldCheck,
  List
} from "lucide-react";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");
  
  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Users", icon: <Users size={20} />, path: "/users" },
    { name: "Coin Settings", icon: <Coins size={20} />, path: "/coin-settings" },
    { name: "List", icon: <List size={20} />, path: "#", subItems: [
      { name: "Crypto", path: "/crypto" },
      { name: "Forex", path: "/forex" },
      { name: "Commodities", path: "/commodities" },
      { name: "Shares", path: "/shares" }
    ]},
    { name: "Trade History", icon: <History size={20} />, path: "/trade-history" },
    { name: "Reports", icon: <FileText size={20} />, path: "/reports" },
    { name: "Admin Wallet", icon: <Wallet size={20} />, path: "/admin-wallet" },
    { name: "Withdraw Wallet", icon: <Wallet size={20} />, path: "/withdraw-wallet" },
    { name: "KYC Submit", icon: <ShieldCheck size={20} />, path: "/kyc-submit" },
  ];

  return (
    <div className="h-screen w-72 bg-gray-900 text-gray-300 flex flex-col p-5 shadow-lg">
      <div className="mb-6 text-white text-center">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <p className="text-sm text-gray-400">superadmin@erax.biz</p>
      </div>
      
      <ul className="space-y-2 overflow-y-auto flex-1">
        {menuItems.map((item, index) => (
          <li key={index}>
            <Link
              to={item.path !== "#" ? item.path : "#"}
              onClick={() => setActive(item.name)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer 
                ${active === item.name ? "bg-blue-600 text-white" : "hover:bg-gray-800"}`}
            >
              {item.icon}
              <span className="text-lg">{item.name}</span>
            </Link>
            {item.subItems && active === item.name && (
              <ul className="ml-6 mt-2 space-y-2">
                {item.subItems.map((subItem, subIndex) => (
                  <li key={subIndex}>
                    <Link
                      to={subItem.path}
                      className="block p-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md"
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
