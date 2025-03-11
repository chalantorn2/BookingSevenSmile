import React, { useState, useEffect } from "react";
import supabase from "../../config/supabaseClient";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const CalendarHighlight = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [bookedDates, setBookedDates] = useState({
    tour: new Set(),
    transfer: new Set(),
    both: new Set(),
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    updateCalendar(currentMonth);
  }, [currentMonth]);

  // เมื่อ selectedDate เปลี่ยน ต้องการให้อัพเดท currentMonth ด้วย
  useEffect(() => {
    // อัพเดท currentMonth เฉพาะเมื่อ selectedDate เปลี่ยนเดือน
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const currentMonthDate = currentMonth.getMonth();
    const currentMonthYear = currentMonth.getFullYear();

    if (
      selectedMonth !== currentMonthDate ||
      selectedYear !== currentMonthYear
    ) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  const updateCalendar = async (date) => {
    setIsLoading(true);
    const year = date.getFullYear();
    const month = date.getMonth();

    // สร้างวันในเดือน
    const firstDay = startOfMonth(date);
    const lastDay = endOfMonth(date);
    const daysCount = lastDay.getDate();

    // สร้างอาร์เรย์ของวันในเดือน
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);
    setDaysInMonth(days);

    // ดึงข้อมูลวันที่มีการจอง
    await fetchBookedDates(year, month);
    setIsLoading(false);
  };

  const fetchBookedDates = async (year, month) => {
    const monthStr = String(month + 1).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-${new Date(
      year,
      month + 1,
      0
    ).getDate()}`;

    try {
      // ดึงข้อมูลทัวร์
      const { data: tourData, error: tourError } = await supabase
        .from("tour_bookings")
        .select("tour_date")
        .gte("tour_date", startDate)
        .lte("tour_date", endDate);

      if (tourError) throw tourError;

      // ดึงข้อมูลการรับส่ง
      const { data: transferData, error: transferError } = await supabase
        .from("transfer_bookings")
        .select("transfer_date")
        .gte("transfer_date", startDate)
        .lte("transfer_date", endDate);

      if (transferError) throw transferError;

      // แยกเก็บวันที่ตามประเภทการจอง
      const tourSet = new Set();
      const transferSet = new Set();
      const bothSet = new Set();

      // Process tour dates
      tourData.forEach((booking) => {
        if (booking.tour_date) {
          tourSet.add(booking.tour_date);
        }
      });

      // Process transfer dates and check for overlaps
      transferData.forEach((booking) => {
        if (booking.transfer_date) {
          if (tourSet.has(booking.transfer_date)) {
            // วันนี้มีทั้ง tour และ transfer
            bothSet.add(booking.transfer_date);
            tourSet.delete(booking.transfer_date); // ลบออกจาก tourSet เพราะจะแสดงใน bothSet แทน
          } else {
            transferSet.add(booking.transfer_date);
          }
        }
      });

      setBookedDates({
        tour: tourSet,
        transfer: transferSet,
        both: bothSet,
      });
    } catch (error) {
      console.error("Error fetching booked dates:", error);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDayClick = (day) => {
    const newDate = new Date(currentMonth);
    newDate.setDate(day);
    onDateSelect(newDate);
  };

  // เช็คประเภทของการจองในแต่ละวัน
  const getDateBookingType = (day) => {
    const dateStr = format(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
      "yyyy-MM-dd"
    );

    if (bookedDates.both.has(dateStr)) return "both";
    if (bookedDates.tour.has(dateStr)) return "tour";
    if (bookedDates.transfer.has(dateStr)) return "transfer";
    return null;
  };

  const isSelected = (day) => {
    return isSameDay(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
      selectedDate
    );
  };

  // กำหนด style ตามประเภทการจองและการเลือก
  const getDayStyle = (day) => {
    const bookingType = getDateBookingType(day);
    const isCurrentDaySelected = isSelected(day);

    let baseClasses =
      "inline-flex items-center justify-center w-10 h-10 font-medium cursor-pointer text-center transition-colors duration-300 rounded-md m-1 ";

    // สำหรับวันที่เลือก
    if (isCurrentDaySelected) {
      return baseClasses + "border-2 border-blue-800 shadow-md font-bold";
    }

    // สำหรับวันที่มีการจอง
    switch (bookingType) {
      case "both":
        return baseClasses + "bg-purple-500 text-white hover:bg-purple-600";
      case "tour":
        return baseClasses + "bg-green-500 text-white hover:bg-green-600";
      case "transfer":
        return baseClasses + "bg-blue-500 text-white hover:bg-blue-600";
      default:
        return baseClasses + "bg-white text-black hover:bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="เดือนก่อนหน้า"
        >
          <ChevronLeft size={20} />
        </button>

        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar size={18} />
          {format(currentMonth, "MMMM yyyy")}
        </h2>

        <button
          onClick={nextMonth}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="เดือนถัดไป"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* แสดงคำอธิบายสี */}
      <div className="flex flex-wrap justify-center items-center gap-3 py-2 mb-4 border-y border-gray-200">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1 bg-green-500"></div>
          <span className="text-sm text-gray-600">ทัวร์</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1 bg-blue-500"></div>
          <span className="text-sm text-gray-600">รถรับส่ง</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1 bg-purple-500"></div>
          <span className="text-sm text-gray-600">ทั้งสองรายการ</span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <div className="flex justify-center items-center flex-wrap gap-1">
          {daysInMonth.map((day) => (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={getDayStyle(day)}
            >
              {day}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarHighlight;
