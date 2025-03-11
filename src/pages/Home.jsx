import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import supabase from "../config/supabaseClient";
import BookingCalendar from "../components/booking/BookingCalendar";
import BookingList from "../components/booking/BookingList";
import BookingDetailModal from "../components/booking/BookingDetailModal";
import BookingStatusLegend from "../components/booking/BookingStatusLegend";
import { CalendarDays, Download } from "lucide-react";

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tourBookings, setTourBookings] = useState([]);
  const [transferBookings, setTransferBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingType, setBookingType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        .select("*, orders(first_name, last_name)")
        .eq("tour_date", date);

      if (tourError) throw tourError;

      // Fetch transfer bookings
      const { data: transferData, error: transferError } = await supabase
        .from("transfer_bookings")
        .select("*, orders(first_name, last_name)")
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
    // This would be implemented with html2canvas or similar library
    alert("ฟังก์ชันส่งออกภาพจะถูกพัฒนาในเวอร์ชันถัดไป");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">รายการจอง</h1>
          <p className="text-gray-600">เลือกวันที่เพื่อดูรายการจอง</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Calendar Column */}
            <div className="md:col-span-1">
              <BookingCalendar
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />

              <div className="mt-4 space-y-2">
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                >
                  <Download size={18} />
                  <span>ส่งออกเป็นภาพ</span>
                </button>

                <a
                  href="/booking-form"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                >
                  <CalendarDays size={18} />
                  <span>สร้างการจองใหม่</span>
                </a>
              </div>
            </div>

            {/* Bookings Column */}
            <div className="md:col-span-3">
              <div id="captureArea">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-red-600">
                    {formattedDate}
                  </h2>
                </div>

                <BookingStatusLegend />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  {/* Tour Bookings */}
                  <div>
                    <div className="bg-white border border-green-200 rounded-lg shadow-sm">
                      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-2 rounded-t-lg">
                        <h3 className="text-lg font-semibold text-center">
                          ทัวร์ ({tourBookings.length})
                        </h3>
                      </div>
                      <div className="p-3">
                        <BookingList
                          bookings={tourBookings}
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
                    <div className="bg-white border border-blue-200 rounded-lg shadow-sm">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-2 rounded-t-lg">
                        <h3 className="text-lg font-semibold text-center">
                          รถรับส่ง ({transferBookings.length})
                        </h3>
                      </div>
                      <div className="p-3">
                        <BookingList
                          bookings={transferBookings}
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
