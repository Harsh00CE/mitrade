import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Coins,
  History,
  Wallet,
  FileText,
  ShieldCheck,
  List as ListIcon,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from "lucide-react";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 👈 for List dropdown

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Users", icon: <Users size={20} />, path: "/users" },
    { name: "Coin Settings", icon: <Coins size={20} />, path: "/coin-settings" },
    {
      name: "List",
      icon: <ListIcon size={20} />,
      path: "#",
      subItems: [
        { name: "Crypto", path: "/crypto" },
        { name: "Forex", path: "/forex" },
        { name: "Commodities", path: "/commodities" },
        { name: "Shares", path: "/shares" }
      ]
    },
    { name: "Trade History", icon: <History size={20} />, path: "/trade-history" },
    { name: "Reports", icon: <FileText size={20} />, path: "/reports" },
    { name: "Admin Wallet", icon: <Wallet size={20} />, path: "/admin-wallet" },
    { name: "Withdraw Wallet", icon: <Wallet size={20} />, path: "/withdraw-wallet" },
    { name: "KYC Submit", icon: <ShieldCheck size={20} />, path: "/kyc-submit" },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-md shadow-lg hover:bg-gray-800 transition lg:top-6 lg:left-6"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-gray-900 text-gray-300 flex flex-col p-5 shadow-lg z-40 transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static
      `}>
        <div className="mb-6 text-white text-center">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-sm text-gray-400">superadmin@erax.biz</p>
        </div>

        <ul className="space-y-2 overflow-y-auto flex-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.subItems ? (
                <div
                  onClick={() => {
                    setOpenDropdown(openDropdown === item.name ? null : item.name);
                    setActive(item.name);
                  }}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer 
                    ${active === item.name ? "bg-blue-600 text-white" : "hover:bg-gray-800"}`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-lg">{item.name}</span>
                  </div>
                  {openDropdown === item.name ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => {
                    setActive(item.name);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer 
                    ${active === item.name ? "bg-blue-600 text-white" : "hover:bg-gray-800"}`}
                >
                  {item.icon}
                  <span className="text-lg">{item.name}</span>
                </Link>
              )}

              {item.subItems && openDropdown === item.name && (
                <ul className="ml-6 mt-2 space-y-2">
                  {item.subItems.map((subItem, subIndex) => (
                    <li key={subIndex}>
                      <Link
                        to={subItem.path}
                        onClick={() => {
                          if (window.innerWidth < 1024) setIsSidebarOpen(false);
                        }}
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

      {/* Optional Overlay for mobile */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
