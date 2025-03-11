import React from "react";
import { format } from "date-fns";
import {
  Eye,
  Clock,
  CalendarCheck,
  Map,
  MapPin,
  Plane,
  User,
  AlignLeft,
  Phone,
  Home,
  Car,
  Tag,
} from "lucide-react";

const BookingList = ({ bookings, type, isLoading, error, onViewDetails }) => {
  if (isLoading) {
    return (
      <div className="text-center py-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-gray-300 border-r-blue-500"></div>
        <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded">
        <p className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="mb-3">
          {type === "tour" ? (
            <Map size={40} className="mx-auto text-gray-400" />
          ) : (
            <Car size={40} className="mx-auto text-gray-400" />
          )}
        </div>
        <p className="text-lg">
          ไม่พบข้อมูลการจอง{type === "tour" ? "ทัวร์" : "รถรับส่ง"}
        </p>
        <p className="text-sm mt-2">ลองเลือกวันที่อื่น หรือเพิ่มการจองใหม่</p>
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
    <div className="space-y-4">
      {bookings.map((booking, index) => {
        const firstName = booking.orders?.first_name || "";
        const lastName = booking.orders?.last_name || "";
        const customerName = `${firstName} ${lastName}`.trim() || "ไม่มีชื่อ";

        return (
          <div
            key={booking.id}
            className={`border rounded-lg overflow-hidden transition-all hover:shadow-md`}
            style={{
              borderLeftWidth: "4px",
              borderLeftColor: type === "tour" ? "#16a34a" : "#2563eb",
            }}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="font-medium flex items-center gap-2">
                  <User size={18} className="text-gray-500" />
                  <span className="text-base">
                    {index + 1}. {customerName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm flex items-center">
                    <User size={14} className="mr-1" />
                    {booking.pax || "-"} คน
                  </span>
                  <button
                    onClick={() => onViewDetails(booking, type)}
                    className={`p-1.5 rounded-full ${
                      type === "tour"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                    title="ดูรายละเอียด"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    type === "tour"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  <Clock size={16} className="mr-1.5" />
                  {type === "tour"
                    ? booking.tour_pickup_time || "-"
                    : booking.transfer_time || "-"}
                </span>

                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    type === "tour"
                      ? "bg-green-50 text-green-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <CalendarCheck size={16} className="mr-1.5" />
                  {type === "tour"
                    ? booking.tour_date
                      ? format(new Date(booking.tour_date), "dd/MM/yyyy")
                      : "-"
                    : booking.transfer_date
                    ? format(new Date(booking.transfer_date), "dd/MM/yyyy")
                    : "-"}
                </span>
              </div>

              <div className="text-sm text-gray-700 border-t border-gray-100 pt-3">
                <div className="mb-2">
                  <span className="font-medium">{booking.send_to || "-"}</span>
                </div>

                {type === "tour" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Home
                        size={16}
                        className="mr-1.5 text-gray-500 flex-shrink-0"
                      />
                      <span className="truncate">
                        โรงแรม: {booking.tour_hotel || "-"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <AlignLeft
                        size={16}
                        className="mr-1.5 text-gray-500 flex-shrink-0"
                      />
                      <span className="truncate">
                        รายละเอียด: {booking.tour_detail || "-"}
                      </span>
                    </div>
                    {booking.tour_contact_no && (
                      <div className="flex items-center">
                        <Phone
                          size={16}
                          className="mr-1.5 text-gray-500 flex-shrink-0"
                        />
                        <span className="truncate">
                          เบอร์: {booking.tour_contact_no}
                        </span>
                      </div>
                    )}
                    {booking.cost_price && (
                      <div className="flex items-center">
                        <Tag
                          size={16}
                          className="mr-1.5 text-gray-500 flex-shrink-0"
                        />
                        <span className="truncate">
                          ราคา: {Number(booking.cost_price).toLocaleString()}{" "}
                          บาท
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin
                        size={16}
                        className="mr-1.5 text-gray-500 flex-shrink-0"
                      />
                      <span className="truncate">
                        รับจาก: {booking.pickup_location || "-"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Map
                        size={16}
                        className="mr-1.5 text-gray-500 flex-shrink-0"
                      />
                      <span className="truncate">
                        ส่งที่: {booking.drop_location || "-"}
                      </span>
                    </div>
                    {booking.transfer_flight && (
                      <div className="flex items-center">
                        <Plane
                          size={16}
                          className="mr-1.5 text-gray-500 flex-shrink-0"
                        />
                        <span className="truncate">
                          ไฟลต์: {booking.transfer_flight}
                        </span>
                      </div>
                    )}
                    {booking.driver_name && (
                      <div className="flex items-center">
                        <User
                          size={16}
                          className="mr-1.5 text-gray-500 flex-shrink-0"
                        />
                        <span className="truncate">
                          คนขับ: {booking.driver_name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  ID: {booking.id || "-"}
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
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
