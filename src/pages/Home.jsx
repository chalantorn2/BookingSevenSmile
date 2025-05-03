import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import supabase from "../config/supabaseClient";
import BookingList from "../components/booking/BookingList";
import BookingDetailModal from "../components/booking/BookingDetailModal";
import BookingStatusLegend from "../components/booking/BookingStatusLegend";
import CalendarHighlight from "../components/booking/CalendarHighlight";
import { useNotification } from "../hooks/useNotification";
import domtoimage from "dom-to-image";
import {
  Plus,
  Printer,
  Users,
  UserCheck,
  Car,
  Download,
  CalendarDays,
  MapPin,
  Camera,
} from "lucide-react";

const Home = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tourBookings, setTourBookings] = useState([]);
  const [transferBookings, setTransferBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingType, setBookingType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // สถานะสำหรับตัวกรอง: 'all', 'pending', 'booked', 'in_progress', 'completed', 'cancelled'

  // Format the selected date for display
  const formattedDate = format(selectedDate, "dd/MM/yyyy");

  // Format date for Supabase query
  const queryDate = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    fetchBookings(queryDate);
  }, [queryDate]);

  const fetchBookings = async (date) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch tour bookings
      const { data: tourData, error: tourError } = await supabase
        .from("tour_bookings")
        .select("*, orders(first_name, last_name, pax)")
        .eq("tour_date", date);

      if (tourError) throw tourError;

      // Fetch transfer bookings
      const { data: transferData, error: transferError } = await supabase
        .from("transfer_bookings")
        .select("*, orders(first_name, last_name, pax)")
        .eq("transfer_date", date);

      if (transferError) throw transferError;

      // Sort by pickup time
      const sortedTourData = tourData.sort((a, b) => {
        return (a.pickup_time || "").localeCompare(b.pickup_time || "");
      });

      const sortedTransferData = transferData.sort((a, b) => {
        return (a.transfer_time || "").localeCompare(b.transfer_time || "");
      });

      setTourBookings(sortedTourData);
      setTransferBookings(sortedTransferData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("ไม่สามารถโหลดข้อมูลการจองได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleViewBookingDetails = (booking, type) => {
    setSelectedBooking(booking);
    setBookingType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    setBookingType(null);
  };

  const handleSaveBooking = async (updatedBooking) => {
    try {
      const table =
        bookingType === "tour" ? "tour_bookings" : "transfer_bookings";

      const { error } = await supabase
        .from(table)
        .update(updatedBooking)
        .eq("id", updatedBooking.id);

      if (error) throw error;

      // Refresh bookings after update
      fetchBookings(queryDate);
      setIsModalOpen(false);

      return { success: true };
    } catch (error) {
      console.error("Error updating booking:", error);
      return { success: false, error: error.message };
    }
  };

  const handleDeleteBooking = async (id) => {
    try {
      const table =
        bookingType === "tour" ? "tour_bookings" : "transfer_bookings";

      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) throw error;

      // Refresh bookings after deletion
      fetchBookings(queryDate);
      setIsModalOpen(false);

      return { success: true };
    } catch (error) {
      console.error("Error deleting booking:", error);
      return { success: false, error: error.message };
    }
  };

  const handleExport = () => {
    const captureArea = document.getElementById("captureArea");
    if (!captureArea) {
      showError("ไม่พบพื้นที่ที่จะแคปภาพ");
      return;
    }

    showInfo("กำลังสร้างภาพ กรุณารอสักครู่...");

    domtoimage
      .toBlob(captureArea, {
        bgcolor: "#ffffff",
        style: {
          "background-color": "#ffffff",
        },
        width: captureArea.scrollWidth,
        height: captureArea.scrollHeight,
        quality: 1,
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "booking-screenshot.png";
        link.click();
        window.URL.revokeObjectURL(url);
        showSuccess("บันทึกภาพสำเร็จ");
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการสร้างภาพ:", error);
        showError("เกิดข้อผิดพลาดในการสร้างภาพ: " + error.message);
      });
  };

  // คำนวณยอดรวมจำนวนคน
  const totalPax =
    tourBookings.reduce((sum, item) => sum + (item.pax || 0), 0) +
    transferBookings.reduce((sum, item) => sum + (item.pax || 0), 0);

  // กรองรายการตามสถานะ
  const filteredTourBookings =
    filter === "all"
      ? tourBookings
      : tourBookings.filter((booking) => booking.status === filter);

  const filteredTransferBookings =
    filter === "all"
      ? transferBookings
      : transferBookings.filter((booking) => booking.status === filter);

  const captureAndCopyScreenshot = () => {
    const captureArea = document.getElementById("captureArea");
    if (!captureArea) {
      showError("ไม่พบพื้นที่ที่จะแคปภาพ");
      return;
    }

    showInfo("กำลังคัดลอกภาพ กรุณารอสักครู่...");

    domtoimage
      .toBlob(captureArea, {
        bgcolor: "#ffffff",
        style: {
          "background-color": "#ffffff",
        },
        width: captureArea.scrollWidth,
        height: captureArea.scrollHeight,
        quality: 1,
      })
      .then((blob) => {
        try {
          const item = new ClipboardItem({ "image/png": blob });
          navigator.clipboard
            .write([item])
            .then(() => showSuccess("คัดลอกรูปภาพไปยังคลิปบอร์ดแล้ว"))
            .catch((error) => {
              console.error("ไม่สามารถคัดลอกไปยังคลิปบอร์ดได้:", error);
              showError("ไม่สามารถคัดลอกไปยังคลิปบอร์ดได้: " + error.message);
            });
        } catch (error) {
          console.error("เกิดข้อผิดพลาดในการคัดลอก:", error);
          showError(
            "เบราว์เซอร์ของคุณไม่รองรับการคัดลอกรูปภาพ: " + error.message
          );
        }
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการสร้างภาพ:", error);
        showError("เกิดข้อผิดพลาดในการสร้างภาพ: " + error.message);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">รายการจอง</h1>
          <p className="text-gray-600">เลือกวันที่เพื่อดูรายการจอง</p>
        </div>

        <CalendarHighlight
          selectedDate={selectedDate}
          onDateSelect={handleDateChange}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div id="captureArea">
            <div className="p-4">
              {/* ส่วนแสดงวันที่และตัวกรองสถานะ */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <h2 className="text-3xl font-bold text-red-600">
                    {formattedDate}
                  </h2>
                  <button
                    onClick={captureAndCopyScreenshot}
                    className="ml-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-all tooltip-container"
                    title="คัดลอกภาพรายการจอง"
                  >
                    <Camera size={20} />
                    {/* <span className="tooltip">คัดลอกรายการจอง</span> */}
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter === "all"
                        ? "bg-gray-200 text-gray-800 font-medium"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setFilter("all")}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter === "pending"
                        ? "bg-gray-600 text-white font-medium"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setFilter("pending")}
                  >
                    รอดำเนินการ
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter === "booked"
                        ? "bg-blue-600 text-white font-medium"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    }`}
                    onClick={() => setFilter("booked")}
                  >
                    จองแล้ว
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter === "in_progress"
                        ? "bg-yellow-600 text-white font-medium"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    }`}
                    onClick={() => setFilter("in_progress")}
                  >
                    กำลังดำเนินการ
                  </button>
                  <button
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter === "completed"
                        ? "bg-green-600 text-white font-medium"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                    onClick={() => setFilter("completed")}
                  >
                    เสร็จสมบูรณ์
                  </button>
                </div>
              </div>

              <BookingStatusLegend />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Tour Bookings */}
                <div>
                  <div className="bg-white border border-green-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-3 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        ทัวร์ ({filteredTourBookings.length})
                      </h3>
                    </div>
                    <div className="p-3">
                      <BookingList
                        bookings={filteredTourBookings}
                        type="tour"
                        isLoading={isLoading}
                        error={error}
                        onViewDetails={handleViewBookingDetails}
                      />
                    </div>
                  </div>
                </div>

                {/* Transfer Bookings */}
                <div>
                  <div className="bg-white border border-blue-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-3 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        รถรับส่ง ({filteredTransferBookings.length})
                      </h3>
                    </div>
                    <div className="p-3">
                      <BookingList
                        bookings={filteredTransferBookings}
                        type="transfer"
                        isLoading={isLoading}
                        error={error}
                        onViewDetails={handleViewBookingDetails}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <BookingDetailModal
          booking={selectedBooking}
          bookingType={bookingType}
          onClose={handleCloseModal}
          onSave={handleSaveBooking}
          onDelete={handleDeleteBooking}
        />
      )}
    </div>
  );
};

export default Home;
