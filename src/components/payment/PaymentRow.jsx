import React from "react";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

const PaymentRow = ({ booking, index, onRemove, onChange }) => {
  const isTour = booking.type === "tour";
  const totalCost =
    (parseFloat(booking.cost) || 0) * (parseInt(booking.quantity) || 0);
  const totalPrice =
    (parseFloat(booking.sellingPrice) || 0) * (parseInt(booking.quantity) || 0);

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return dateStr.split("-").reverse().join("/");
    } catch (error) {
      return dateStr;
    }
  };
  // console.log(booking.reference_id);

  return (
    <tr className={isTour ? "bg-green-50 " : "bg-blue-50 "}>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex flex-col">
          <span
            className={`text-sm font-medium ${
              isTour ? "text-green-800" : "text-blue-800"
            }`}
          >
            {booking.sendTo || "-"}
          </span>
          <span className="text-xs text-gray-500">
            {formatDateDisplay(booking.date)} | ID: {booking.id}
          </span>
        </div>
      </td>
      <td className="px-3 py-2">
        <textarea
          className="w-full border p-1 rounded-md text-sm"
          value={booking.hotel || ""}
          onChange={(e) => onChange(index, "hotel", e.target.value)}
          rows="2"
          placeholder={isTour ? "โรงแรม" : "-"}
        />
      </td>
      <td className="px-3 py-2">
        <textarea
          className="w-full border p-1 rounded-md text-sm"
          value={booking.detail || ""}
          onChange={(e) => onChange(index, "detail", e.target.value)}
          rows="2"
          placeholder="รายละเอียด"
        />
      </td>
      <td className="px-3 py-2">
        <select
          className="w-full border p-1 rounded-md text-sm"
          value={booking.bookingType}
          onChange={(e) => onChange(index, "bookingType", e.target.value)}
        >
          <option value="">--Select--</option>
          <option value="ADL">ADL</option>
          <option value="CHD">CHD</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          className="w-full border p-1 rounded-md text-sm text-right"
          value={booking.cost}
          onChange={(e) => onChange(index, "cost", e.target.value)}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          className="w-full border p-1 rounded-md text-sm text-center"
          value={booking.quantity}
          onChange={(e) => onChange(index, "quantity", e.target.value)}
        />
      </td>
      <td className="px-3 py-2 text-center font-medium">
        {formatNumber(totalCost)}
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          className="w-full border p-1 rounded-md text-sm text-right"
          value={booking.sellingPrice}
          onChange={(e) => onChange(index, "sellingPrice", e.target.value)}
        />
      </td>
      <td className="px-3 py-2 text-center font-medium">
        {formatNumber(totalPrice)}
      </td>
      <td className="px-3 py-2">
        <select
          className={`w-full border p-1 rounded-md text-sm ${
            booking.status === "paid"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
          value={booking.status}
          onChange={(e) => onChange(index, "status", e.target.value)}
        >
          <option className="bg-red-600 text-white" value="notPaid">
            ยังไม่จ่าย
          </option>
          <option className="bg-green-600 text-white" value="paid">
            จ่ายแล้ว
          </option>
        </select>
      </td>
      <td className="px-3 py-2">
        <textarea
          className="w-full border p-1 rounded-md text-sm"
          value={booking.remark}
          onChange={(e) => onChange(index, "remark", e.target.value)}
          rows="1"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <button
          className="text-red-600 hover:text-red-800 p-1"
          onClick={() => onRemove(index)}
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};

export default PaymentRow;
