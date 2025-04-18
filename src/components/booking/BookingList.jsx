import React from "react";
import { format } from "date-fns";
import {
  Eye,
  Clock,
  CalendarCheck,
  MapPin,
  Plane,
  User,
  Hotel,
  FileText,
  BedDouble,
} from "lucide-react";

const BookingList = ({ bookings, type, isLoading, error, onViewDetails }) => {
  console.log(`${type} bookings:`, bookings);
  const getStatusBackgroundStyle = (status) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-br from-gray-200 via-gray-100 to-white";
      case "booked":
        return "bg-gradient-to-br from-blue-200 via-blue-100 to-white";
      case "in_progress":
        return "bg-gradient-to-br from-yellow-200 via-yellow-100 to-white";
      case "completed":
        return "bg-gradient-to-br from-green-200 via-green-100 to-white";
      case "cancelled":
        return "bg-gradient-to-br from-red-200 via-red-100 to-white";
      default:
        return "bg-gradient-to-br from-gray-200 via-gray-100 to-white";
    }
  };
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
      {[...bookings]
        .sort((a, b) => {
          const timeA = a.tour_pickup_time || a.transfer_time || "";
          const timeB = b.tour_pickup_time || b.transfer_time || "";
          return timeA.localeCompare(timeB); // เรียงจากเช้าไปเย็น
        })
        .map((booking, index) => {
          const firstName = booking.orders?.first_name || "";
          const lastName = booking.orders?.last_name || "";
          const customerName = `${firstName} ${lastName}`.trim() || "ไม่มีชื่อ";

          // ตรวจสอบการเข้าถึงข้อมูล pax และแสดงในค่าที่ปลอดภัย
          let paxDisplay = "-";
          if (booking.orders && booking.orders.pax) {
            paxDisplay = booking.orders.pax;
          } else if (booking.pax) {
            // ถ้าไม่มีใน orders ให้ใช้จาก booking โดยตรงเป็น fallback
            paxDisplay = booking.pax;
          }

          return (
            <div
              key={booking.id}
              className={`border border-gray-500 rounded-md overflow-hidden transition-all hover:shadow-md ${getStatusBackgroundStyle(
                booking.status
              )}`}
              style={{
                borderLeftWidth: "5px",
                borderLeftColor: type === "tour" ? "#16a34a" : "#2563eb",
              }}
            >
              <div className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-lg flex items-center gap-1">
                    {index + 1}.
                    <User size={18} className="text-gray-500" />
                    <span>
                      {customerName} | {paxDisplay} คน
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
                    className={`inline-flex items-center px-2 py-1 font-medium text-base rounded ${
                      type === "tour"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    <Clock size={16} className="mr-1 " />
                    {type === "tour"
                      ? booking.tour_pickup_time || "-"
                      : booking.transfer_time || "-"}
                  </span>

                  <span
                    className={`inline-flex items-center px-2 py-1 font-medium text-base rounded ${
                      type === "tour"
                        ? "bg-green-50 text-green-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <CalendarCheck size={16} className="mr-1" />
                    {type === "tour"
                      ? format(new Date(booking.tour_date), "dd/MM/yyyy")
                      : format(new Date(booking.transfer_date), "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {type === "tour" ? (
                    <>
                      <div className="flex flex-wrap gap-x-4 text-base text-gray-800 mb-1">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">
                            {booking.send_to || "-"}
                          </span>{" "}
                          <Hotel size={16} className="mr-1" />
                          <span>
                            <b>โรงแรม:</b> {booking.tour_hotel || "-"}
                          </span>
                          <BedDouble size={16} className="ml-2 mr-1" />
                          {booking.tour_room_no && (
                            <div className="flex  items-center">
                              <span>
                                <b>ห้อง:</b> {booking.tour_room_no}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 text-xs text-gray-600 mb-2">
                        <div className="flex items-center">
                          <FileText size={14} className="mr-1" />
                          <span>
                            <b>รายละเอียด:</b> {booking.tour_detail || "-"}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-x-4 text-base text-gray-800 mb-1">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">
                            {booking.send_to || "-"}
                          </span>
                          <MapPin size={14} className="mr-1" />
                          <span>
                            <b>รับจาก:</b> {booking.pickup_location || "-"}
                          </span>
                          <MapPin size={14} className="ml-2 mr-1" />
                          <span>
                            <b>ส่งที่:</b> {booking.drop_location || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 text-base text-gray-800 mb-2">
                        {booking.transfer_flight && (
                          <div className="flex items-center">
                            <Plane size={16} className="mr-1" />
                            <span>
                              <b>ไฟลต์:</b> {booking.transfer_flight}
                            </span>
                          </div>
                        )}
                        {booking.transfer_ftime && (
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            <span>
                              <b>เวลา:บิน</b> {booking.transfer_ftime}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-500">
                  <span>
                    {booking.reference_id
                      ? booking.reference_id
                      : `ID: ${booking.id || "-"}`}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {translateStatus(booking.status)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default BookingList;
