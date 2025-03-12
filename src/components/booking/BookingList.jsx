import React from "react";
import { format } from "date-fns";
import {
  Eye,
  Clock,
  CalendarCheck,
  Map,
  Plane,
  User,
  Hotel,
  FileText,
} from "lucide-react";

const BookingList = ({ bookings, type, isLoading, error, onViewDetails }) => {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-gray-300 border-r-blue-500"></div>
        <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        ไม่พบข้อมูลการจอง{type === "tour" ? "ทัวร์" : "รถรับส่ง"}
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gray-200 text-gray-800";
      case "booked":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const translateStatus = (status) => {
    const statusMap = {
      pending: "รอดำเนินการ",
      booked: "จองแล้ว",
      in_progress: "ดำเนินการอยู่",
      completed: "เสร็จสมบูรณ์",
      cancelled: "ยกเลิก",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-3">
      {bookings.map((booking, index) => {
        const firstName = booking.orders?.first_name || "";
        const lastName = booking.orders?.last_name || "";
        const customerName = `${firstName} ${lastName}`.trim() || "ไม่มีชื่อ";

        return (
          <div
            key={booking.id}
            className={`border rounded-md overflow-hidden transition-all hover:shadow-md`}
            style={{
              borderLeftWidth: "4px",
              borderLeftColor: type === "tour" ? "#16a34a" : "#2563eb",
            }}
          >
            <div className="p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium flex items-center gap-1">
                  <User size={16} className="text-gray-500" />
                  <span>
                    {index + 1}. {customerName} | {booking.pax || "-"} คน
                  </span>
                </div>
                <button
                  onClick={() => onViewDetails(booking, type)}
                  className={`p-1 rounded-full ${
                    type === "tour"
                      ? "text-green-700 hover:bg-green-50"
                      : "text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <Eye size={18} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-2 text-xs">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded ${
                    type === "tour"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  <Clock size={14} className="mr-1" />
                  {type === "tour"
                    ? booking.tour_pickup_time || "-"
                    : booking.transfer_time || "-"}
                </span>

                <span
                  className={`inline-flex items-center px-2 py-1 rounded ${
                    type === "tour"
                      ? "bg-green-50 text-green-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <CalendarCheck size={14} className="mr-1" />
                  {type === "tour"
                    ? format(new Date(booking.tour_date), "dd/MM/yyyy")
                    : format(new Date(booking.transfer_date), "dd/MM/yyyy")}
                </span>
              </div>

              <div className="text-sm text-gray-700">
                <div className="mb-1">
                  <span className="font-medium">{booking.send_to || "-"}</span>
                </div>

                {type === "tour" ? (
                  <>
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-600 mb-1">
                      <div className="flex items-center">
                        <Hotel size={14} className="mr-1" />
                        <span>โรงแรม: {booking.tour_hotel || "-"}</span>
                      </div>
                      {booking.tour_room_no && (
                        <div className="flex items-center">
                          <span>ห้อง: {booking.tour_room_no}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
                      <div className="flex items-center">
                        <FileText size={14} className="mr-1" />
                        <span>รายละเอียด: {booking.tour_detail || "-"}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-600 mb-1">
                      <div className="flex items-center">
                        <Map size={14} className="mr-1" />
                        <span>รับจาก: {booking.pickup_location || "-"}</span>
                      </div>
                      <div className="flex items-center">
                        <Map size={14} className="mr-1" />
                        <span>ส่งที่: {booking.drop_location || "-"}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
                      <div className="flex items-center">
                        <FileText size={14} className="mr-1" />
                        <span>
                          รายละเอียด: {booking.transfer_detail || "-"}
                        </span>
                      </div>
                      {booking.transfer_flight && (
                        <div className="flex items-center">
                          <Plane size={14} className="mr-1" />
                          <span>ไฟลต์: {booking.transfer_flight}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center mt-2 text-xs">
                <div className="text-gray-500">ID: {booking.id || "-"}</div>
                <div
                  className={`px-2 py-1 rounded-full ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {translateStatus(booking.status)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookingList;
