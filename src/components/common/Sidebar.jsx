import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BarChart2,
  Calendar,
  ClipboardPlus,
  FileText,
  CreditCard,
  PieChart,
  Database,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: "/", label: "Home", icon: <Home size={20} /> },
    {
      path: "/booking-form",
      label: "Bookings",
      icon: <ClipboardPlus size={20} />,
    },
    { path: "/orders", label: "Orders", icon: <Calendar size={20} /> },
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <BarChart2 size={20} />,
      disabled: true,
    },
    {
      path: "/invoices",
      label: "Invoice",
      icon: <FileText size={20} />,
      disabled: true,
    },
    {
      path: "/payments",
      label: "Payment",
      icon: <CreditCard size={20} />,
      disabled: true,
    },
    {
      path: "/information",
      label: "Information",
      icon: <Database size={20} />,
    },
    {
      path: "/reports",
      label: "Report",
      icon: <PieChart size={20} />,
      disabled: true,
    },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={`h-screen bg-blue-500 text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-15" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-blue-400">
        <div className="flex items-center justify-between">
          {!collapsed && <h1 className="text-2xl font-bold">SevenSmile</h1>}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-full hover:bg-blue-600 transition-colors"
          >
            {collapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          {navItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.disabled ? "#" : item.path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  item.disabled
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-blue-600"
                } ${
                  location.pathname === item.path && !item.disabled
                    ? "bg-white text-blue-500"
                    : ""
                }`}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                  }
                }}
              >
                <span className="mr-3">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue-400">
        {!collapsed && (
          <div className="text-sm text-blue-200">
            &copy; {new Date().getFullYear()} SevenSmile
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
