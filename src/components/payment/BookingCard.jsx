import React from "react";
import { PlusCircle, ArrowRight } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

const BookingCard = ({ booking, type, onAddBooking }) => {
  const isTour = type === "tour";

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const parsedDate = parseISO(dateStr);
      if (isValid(parsedDate)) {
        return format(parsedDate, "dd/MM/yyyy");
      }
      return dateStr.split("-").reverse().join("/");
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <div
      className={`border ${
        isTour ? "border-green-200" : "border-blue-200"
      } rounded-lg hover:shadow-md transition-shadow overflow-hidden`}
    >
      <div
        className={`${
          isTour
            ? "bg-green-50 border-l-4 border-green-500"
            : "bg-blue-50 border-l-4 border-blue-500"
        } p-3`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p
              className={`font-medium ${
                isTour ? "text-green-800" : "text-blue-800"
              }`}
            >
              {booking.send_to || "-"} |{" "}
              {formatDateDisplay(
                isTour ? booking.tour_date : booking.transfer_date
              )}
            </p>

            {/* Show different details based on booking type */}
            {isTour ? (
              <p className="text-sm text-gray-600 mt-1">
                {booking.tour_hotel || "-"} | {booking.pax || "-"} คน
              </p>
            ) : (
              <p className="text-sm flex items-center text-gray-600 mt-1">
                {booking.pickup_location || "-"}{" "}
                <ArrowRight size={12} className="mx-1" />{" "}
                {booking.drop_location || "-"} | {booking.pax || "-"} คน
              </p>
            )}
          </div>

          <button
            className={`${
              isTour ? "bg-green-600" : "bg-blue-600"
            } text-white p-1 rounded hover:${
              isTour ? "bg-green-700" : "bg-blue-700"
            }`}
            onClick={() => onAddBooking(booking, type)}
          >
            <PlusCircle size={20} />
          </button>
        </div>

        <p className="text-sm italic text-gray-600 mt-1">
          {isTour ? booking.tour_detail : booking.transfer_detail || "-"}
        </p>
      </div>
    </div>
  );
};

export default BookingCard;
