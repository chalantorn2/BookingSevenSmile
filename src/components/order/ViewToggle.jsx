import React from "react";
import { LayoutGrid, List } from "lucide-react";

const ViewToggle = ({ viewMode, onToggle }) => {
  return (
    <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <button
        className={`flex items-center px-3 py-2 ${
          viewMode === "card"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => onToggle("card")}
      >
        <LayoutGrid size={18} className="mr-2" />
        Cards
      </button>
      <button
        className={`flex items-center px-3 py-2 ${
          viewMode === "table"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => onToggle("table")}
      >
        <List size={18} className="mr-2" />
        Table
      </button>
    </div>
  );
};

export default ViewToggle;
