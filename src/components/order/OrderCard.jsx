import React from "react";
import {
  Eye,
  Tag,
  Calendar,
  Users,
  Ticket,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

const OrderCard = ({ orders, onViewDetails, onUpdateNote }) => {
  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const parsedDate = parseISO(dateStr);
      if (isValid(parsedDate)) {
        return format(parsedDate, "dd/MM/yyyy");
      }
      return dateStr;
    } catch (error) {
      return dateStr;
    }
  };

  // Get date range display
  const getDateRangeDisplay = (order) => {
    const startDate = order.start_date
      ? formatDateDisplay(order.start_date)
      : "-";
    const endDate = order.end_date ? formatDateDisplay(order.end_date) : "-";

    return startDate === endDate || startDate === "-" || endDate === "-"
      ? startDate
      : `${startDate} - ${endDate}`;
  };

  // Format voucher numbers
  const formatVouchers = (vouchersList) => {
    if (!vouchersList || vouchersList.length === 0) return null;
    return vouchersList.map((v) => `${v.year_number}-${v.sequence_number}`);
  };

  // Handle note change
  const handleNoteChange = (orderId, e) => {
    if (e.key === "Enter" || e.type === "blur") {
      onUpdateNote(orderId, e.target.value);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow-md">
        <p className="text-gray-500">ไม่พบข้อมูล Order</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const voucherNumbers = formatVouchers(order.vouchers);

        return (
          <div
            key={order.id}
            className="bg-white rounded-lg shadow-md border-l-4 border-l-blue-500 transition-all hover:shadow-lg"
          >
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {order.reference_id || `Order #${order.id}`}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        order.completed
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.completed ? (
                        <span className="flex items-center">
                          <CheckCircle size={12} className="mr-1" />
                          เรียบร้อย
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <XCircle size={12} className="mr-1" />
                          ยังไม่เรียบร้อย
                        </span>
                      )}
                    </span>
                  </div>
                  <h5 className="text-lg font-medium">
                    {`${order.first_name || ""} ${
                      order.last_name || ""
                    }`.trim() || "No Name"}
                  </h5>
                  <p className="text-gray-600 flex items-center mt-1">
                    <Calendar size={16} className="mr-1" />
                    {getDateRangeDisplay(order)}
                  </p>

                  {voucherNumbers && voucherNumbers.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Ticket size={16} className="text-blue-500 mr-1" />
                      {voucherNumbers.map((number, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded"
                        >
                          {number}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="md:col-span-3">
                  <div className="flex flex-col">
                    <div className="mb-2">
                      <span className="text-sm text-gray-500">Agent:</span>
                      <span className="ml-2 font-medium">
                        {order.agent_name || "-"}
                      </span>
                    </div>
                    <span className="bg-blue-100 text-blue-800 font-medium rounded-full px-3 py-1 flex items-center self-start">
                      <Users size={16} className="mr-1" />
                      {order.pax || "0"} PAX
                    </span>
                    <div className="text-sm text-gray-600 mt-2">
                      {order.bookingsCount || 0} Bookings
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center mb-1">
                      <FileText size={16} className="text-gray-500 mr-1" />
                      <span className="text-sm text-gray-600">หมายเหตุ:</span>
                    </div>
                    <textarea
                      placeholder="คลิกเพื่อเพิ่มหมายเหตุ"
                      defaultValue={order.note || ""}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleNoteChange(order.id, e)
                      }
                      onBlur={(e) => handleNoteChange(order.id, e)}
                      className="flex-1 border rounded-md p-2 text-sm w-full resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="md:col-span-1 flex items-center justify-end">
                  <button
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition flex items-center"
                    onClick={() => onViewDetails(order)}
                  >
                    <Eye size={16} className="mr-1" />
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderCard;
