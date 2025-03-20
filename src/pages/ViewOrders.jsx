import React, { useState, useEffect } from "react";
import { format, isValid, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import supabase from "../config/supabaseClient";
import {
  Search,
  Calendar,
  Filter,
  RefreshCcw,
  Plus,
  Eye,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Tag,
  Users,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Layout from "../components/common/Layout";
import BookingStatusLegend from "../components/booking/BookingStatusLegend";
import { formatDate } from "../utils/dateUtils";

const ViewOrders = () => {
  // State hooks
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderBookings, setOrderBookings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return format(firstDay, "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => {
    return format(new Date(), "yyyy-MM-dd");
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, invoiced, notInvoiced

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Confirmations
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [showRemoveBookingConfirm, setShowRemoveBookingConfirm] =
    useState(false);
  const [bookingToRemove, setBookingToRemove] = useState(null);

  // Add booking modal
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [selectedBookingsToAdd, setSelectedBookingsToAdd] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalBookings: 0,
    filteredCount: 0,
  });

  // First load effect
  useEffect(() => {
    fetchOrders();
    fetchAvailableBookings();
  }, []);

  // Filter effect
  useEffect(() => {
    const filterOrders = async () => {
      let result = [...orders];

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        result = await Promise.all(
          result.map(async (order) => {
            // ดึงข้อมูล bookings ทั้งหมดของ order
            const { data: tourBookings } = await supabase
              .from("tour_bookings")
              .select("tour_date")
              .eq("order_id", order.id);

            const { data: transferBookings } = await supabase
              .from("transfer_bookings")
              .select("transfer_date")
              .eq("order_id", order.id);

            const allDates = [
              ...(tourBookings || []).map((b) => new Date(b.tour_date)),
              ...(transferBookings || []).map((b) => new Date(b.transfer_date)),
            ].filter(Boolean);

            // ตรวจสอบว่ามีวันที่ใดอยู่ในช่วงหรือไม่
            const isInRange = allDates.some(
              (date) => date >= start && date <= end
            );

            return isInRange ? order : null;
          })
        );

        result = result.filter(Boolean); // กรองเอาเฉพาะ order ที่ไม่เป็น null
      }

      // Filter by search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        result = result.filter((order) => {
          // Check reference_id
          if (
            order.reference_id &&
            order.reference_id.toLowerCase().includes(term)
          ) {
            return true;
          }

          // Check customer name
          const customerName = `${order.first_name || ""} ${
            order.last_name || ""
          }`.toLowerCase();
          if (customerName.includes(term)) {
            return true;
          }

          // Check agent name
          if (
            order.agent_name &&
            order.agent_name.toLowerCase().includes(term)
          ) {
            return true;
          }

          return false;
        });
      }

      // Filter by invoice status
      if (filterType === "invoiced") {
        result = result.filter((order) => order.is_invoiced);
      } else if (filterType === "notInvoiced") {
        result = result.filter((order) => !order.is_invoiced);
      }

      setFilteredOrders(result);
      setStats((prev) => ({
        ...prev,
        filteredCount: result.length,
      }));
      setCurrentPage(1);
    };

    filterOrders();
  }, [orders, startDate, endDate, searchTerm, filterType]);

  // Fetch orders with related bookings
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Process orders with bookings
      const processedOrders = await Promise.all(
        ordersData.map(async (order) => {
          // Fetch tour bookings
          const { data: tourBookings, error: tourError } = await supabase
            .from("tour_bookings")
            .select("*")
            .eq("order_id", order.id);

          if (tourError) throw tourError;

          // Fetch transfer bookings
          const { data: transferBookings, error: transferError } =
            await supabase
              .from("transfer_bookings")
              .select("*")
              .eq("order_id", order.id);

          if (transferError) throw transferError;

          // Combine all bookings
          const allBookings = [
            ...(tourBookings || []),
            ...(transferBookings || []),
          ];

          // Find earliest and latest dates
          const dates = allBookings
            .map((booking) => {
              // Use tour_date or transfer_date depending on booking type
              return booking.tour_date || booking.transfer_date;
            })
            .filter(Boolean)
            .map((dateStr) => new Date(dateStr))
            .sort((a, b) => a - b);

          const earliestDate = dates.length > 0 ? dates[0] : null;
          const latestDate = dates.length > 0 ? dates[dates.length - 1] : null;

          // Check if order is invoiced (for now, default to false - you'll implement this later)
          const isInvoiced = false; // Will be implemented when you have payments/invoices

          return {
            ...order,
            bookingsCount: allBookings.length,
            tourCount: tourBookings ? tourBookings.length : 0,
            transferCount: transferBookings ? transferBookings.length : 0,
            earliestDate,
            latestDate,
            is_invoiced: isInvoiced,
          };
        })
      );

      setOrders(processedOrders);
      setStats({
        totalOrders: processedOrders.length,
        totalBookings: processedOrders.reduce(
          (sum, order) => sum + order.bookingsCount,
          0
        ),
        filteredCount: processedOrders.length,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Fetch bookings not associated with any order
  const fetchAvailableBookings = async () => {
    try {
      // Fetch tour bookings with no order_id
      const { data: tourBookings, error: tourError } = await supabase
        .from("tour_bookings")
        .select("*")
        .is("order_id", null);

      if (tourError) throw tourError;

      // Fetch transfer bookings with no order_id
      const { data: transferBookings, error: transferError } = await supabase
        .from("transfer_bookings")
        .select("*")
        .is("order_id", null);

      if (transferError) throw transferError;

      // Format tour bookings
      const formattedTours = (tourBookings || []).map((tour) => ({
        id: tour.id,
        type: "tour",
        agent: tour.tour_agent || "",
        date: tour.tour_date,
        time: tour.tour_pickup_time || "",
        customer: `${tour.tour_first_name || ""} ${
          tour.tour_last_name || ""
        }`.trim(),
        pax: tour.pax || 0,
      }));

      // Format transfer bookings
      const formattedTransfers = (transferBookings || []).map((transfer) => ({
        id: transfer.id,
        type: "transfer",
        agent: transfer.transfer_agent || "",
        date: transfer.transfer_date,
        time: transfer.transfer_time || "",
        customer: `${transfer.transfer_first_name || ""} ${
          transfer.transfer_last_name || ""
        }`.trim(),
        pax: transfer.pax || 0,
      }));

      // Combine and sort by date
      const combined = [...formattedTours, ...formattedTransfers].sort(
        (a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);

          if (dateA - dateB === 0) {
            return a.time.localeCompare(b.time);
          }

          return dateA - dateB;
        }
      );

      setAvailableBookings(combined);
    } catch (error) {
      console.error("Error fetching available bookings:", error);
    }
  };

  // Show order details modal
  const handleViewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setLoading(true);

    try {
      // Fetch tour bookings for this order
      const { data: tourBookings, error: tourError } = await supabase
        .from("tour_bookings")
        .select("*")
        .eq("order_id", order.id);

      if (tourError) throw tourError;

      // Fetch transfer bookings for this order
      const { data: transferBookings, error: transferError } = await supabase
        .from("transfer_bookings")
        .select("*")
        .eq("order_id", order.id);

      if (transferError) throw transferError;

      // Combine and format bookings for display
      const allBookings = [
        ...(tourBookings || []).map((booking) => ({
          ...booking,
          bookingType: "tour",
          date: booking.tour_date,
          time: booking.tour_pickup_time,
        })),
        ...(transferBookings || []).map((booking) => ({
          ...booking,
          bookingType: "transfer",
          date: booking.transfer_date,
          time: booking.transfer_time,
        })),
      ];

      // Sort by date and time
      allBookings.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (dateA - dateB === 0) {
          return (a.time || "").localeCompare(b.time || "");
        }

        return dateA - dateB;
      });

      setOrderBookings(allBookings);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  // Delete order
  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    setLoading(true);
    try {
      // Get all bookings to update
      const { data: tourBookings } = await supabase
        .from("tour_bookings")
        .select("id")
        .eq("order_id", orderToDelete.id);

      const { data: transferBookings } = await supabase
        .from("transfer_bookings")
        .select("id")
        .eq("order_id", orderToDelete.id);

      // Release bookings from this order
      for (const booking of tourBookings || []) {
        await supabase
          .from("tour_bookings")
          .update({ order_id: null })
          .eq("id", booking.id);
      }

      for (const booking of transferBookings || []) {
        await supabase
          .from("transfer_bookings")
          .update({ order_id: null })
          .eq("id", booking.id);
      }

      // Delete the order
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderToDelete.id);

      if (error) throw error;

      // Refresh data
      await fetchOrders();
      await fetchAvailableBookings();

      // Close modal and reset
      setShowDeleteConfirm(false);
      setOrderToDelete(null);

      // Show success message
      showSuccessMessage("Order deleted successfully");
    } catch (error) {
      console.error("Error deleting order:", error);
      showErrorMessage("Failed to delete order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove booking from order
  const handleConfirmRemoveBooking = async () => {
    if (!bookingToRemove || !selectedOrder) return;

    setLoading(true);
    try {
      const { bookingId, bookingType } = bookingToRemove;
      const tableName =
        bookingType === "tour" ? "tour_bookings" : "transfer_bookings";

      // Update booking to remove order_id
      const { error } = await supabase
        .from(tableName)
        .update({ order_id: null })
        .eq("id", bookingId);

      if (error) throw error;

      // Refresh order details
      await handleViewOrderDetails(selectedOrder);

      // Refresh all data
      await fetchOrders();
      await fetchAvailableBookings();

      // Close modal and reset
      setShowRemoveBookingConfirm(false);
      setBookingToRemove(null);

      // Show success message
      showSuccessMessage("Booking removed successfully");
    } catch (error) {
      console.error("Error removing booking:", error);
      showErrorMessage("Failed to remove booking: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add bookings to order
  const handleAddBookingsToOrder = async (orderId) => {
    if (!selectedBookingsToAdd.length || !orderId) return;

    setLoading(true);
    try {
      // Update each selected booking with the order ID
      for (const booking of selectedBookingsToAdd) {
        const tableName =
          booking.type === "tour" ? "tour_bookings" : "transfer_bookings";

        const { error } = await supabase
          .from(tableName)
          .update({ order_id: orderId })
          .eq("id", booking.id);

        if (error) throw error;
      }

      // Refresh data
      await fetchOrders();
      await fetchAvailableBookings();

      // If viewing order details, refresh them too
      if (selectedOrder && selectedOrder.id === orderId) {
        await handleViewOrderDetails(selectedOrder);
      }

      // Close modal and reset
      setShowAddBookingModal(false);
      setSelectedBookingsToAdd([]);

      // Show success message
      showSuccessMessage(
        `${selectedBookingsToAdd.length} bookings added to order`
      );
    } catch (error) {
      console.error("Error adding bookings to order:", error);
      showErrorMessage("Failed to add bookings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter type change
  const handleFilterTypeChange = (type) => {
    setFilterType(type);
  };

  // ฟังก์ชัน applyFilters ที่แก้ไข
  const applyFilters = () => {
    if (!startDate || !endDate) {
      showErrorMessage("Please select both start and end dates.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      showErrorMessage("Start date cannot be later than end date.");
      return;
    }

    // การกรองถูกจัดการใน useEffect แล้ว ดังนั้นที่นี่แค่แจ้งว่ากรองสำเร็จ
    showSuccessMessage("Filters applied successfully.");
  };

  // Pagination helpers
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper for showing messages
  const showSuccessMessage = (message) => {
    // You could implement a toast notification here
    alert(message);
  };

  const showErrorMessage = (message) => {
    // You could implement a toast notification here
    alert("Error: " + message);
  };

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "-";

    try {
      if (typeof dateStr === "string") {
        const parsedDate = parseISO(dateStr);
        if (isValid(parsedDate)) {
          return format(parsedDate, "dd/MM/yyyy");
        }
      } else if (dateStr instanceof Date && isValid(dateStr)) {
        return format(dateStr, "dd/MM/yyyy");
      }
      return "-";
    } catch (error) {
      return "-";
    }
  };

  // Date range display helper
  const getDateRangeDisplay = (order) => {
    const earliestDate = order.earliestDate
      ? formatDisplayDate(order.earliestDate)
      : "-";
    const latestDate = order.latestDate
      ? formatDisplayDate(order.latestDate)
      : "-";

    return earliestDate === latestDate ||
      earliestDate === "-" ||
      latestDate === "-"
      ? earliestDate
      : `${earliestDate} - ${latestDate}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Orders Management
          </h1>
          <p className="text-gray-600">View and manage your booking orders</p>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <a
            href="/booking-form"
            className="btn btn-primary flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Create New Order
          </a>
          <button
            className="btn btn-success flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            onClick={fetchOrders}
          >
            <RefreshCcw size={18} />
            Refresh Orders
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6 p-4">
          <h5 className="font-medium text-lg mb-3 flex items-center">
            <Filter size={18} className="mr-2" />
            Filter Orders
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                From Date
              </label>
              <div className="flex items-center border rounded-md">
                <span className="px-2 text-gray-500">
                  <Calendar size={18} />
                </span>
                <input
                  type="date"
                  id="startDate"
                  className="w-full p-2 rounded-md focus:outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-5">
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                To Date
              </label>
              <div className="flex items-center border rounded-md">
                <span className="px-2 text-gray-500">
                  <Calendar size={18} />
                </span>
                <input
                  type="date"
                  id="endDate"
                  className="w-full p-2 rounded-md focus:outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-2 flex items-end">
              <button
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
                onClick={applyFilters}
              >
                <Search size={18} className="mr-2" />
                Apply
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
            <div className="md:col-span-6">
              <div className="flex items-center border rounded-md">
                <span className="px-2 text-gray-500">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="w-full p-2 rounded-md focus:outline-none"
                  placeholder="Search by name or order ID..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="md:col-span-6 flex justify-end">
              <div className="flex rounded-md overflow-hidden">
                <button
                  className={`px-3 py-2 border ${
                    filterType === "all"
                      ? "bg-gray-200 font-medium"
                      : "bg-white"
                  }`}
                  onClick={() => handleFilterTypeChange("all")}
                >
                  All Orders
                </button>
                <button
                  className={`px-3 py-2 border ${
                    filterType === "invoiced"
                      ? "bg-gray-200 font-medium"
                      : "bg-white"
                  }`}
                  onClick={() => handleFilterTypeChange("invoiced")}
                >
                  Invoiced
                </button>
                <button
                  className={`px-3 py-2 border ${
                    filterType === "notInvoiced"
                      ? "bg-gray-200 font-medium"
                      : "bg-white"
                  }`}
                  onClick={() => handleFilterTypeChange("notInvoiced")}
                >
                  Not Invoiced
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <h5 className="text-gray-700 font-medium">Total Orders</h5>
            <p className="text-4xl font-bold text-blue-600 mt-2">
              {stats.totalOrders}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <h5 className="text-gray-700 font-medium">Total Bookings</h5>
            <p className="text-4xl font-bold text-green-600 mt-2">
              {stats.totalBookings}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <h5 className="text-gray-700 font-medium">Filtered Results</h5>
            <p className="text-4xl font-bold text-indigo-600 mt-2">
              {stats.filteredCount}
            </p>
          </div>
        </div>
        {/* No Orders Message */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-blue-50 text-blue-800 p-4 rounded-md flex items-center justify-center mb-6">
            <AlertCircle size={20} className="mr-2" />
            <span>
              No orders found matching your criteria. Try adjusting your
              filters.
            </span>
          </div>
        )}
        {/* Loading Indicator */}
        {loading && (
          <div className="text-center my-6">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-opacity-25 rounded-full border-t-blue-500 animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        )}
        {/* Orders List */}
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-lg shadow-md border-l-4 ${
                order.is_invoiced ? "border-l-green-500" : "border-l-yellow-500"
              } transition-all hover:shadow-lg`}
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
                          order.is_invoiced
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.is_invoiced ? "Invoiced" : "Not Invoiced"}
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
                  </div>
                  <div className="md:col-span-3 flex flex-col justify-center items-center">
                    <span className="bg-blue-100 text-blue-800 font-medium rounded-full px-3 py-1 flex items-center">
                      <Tag size={16} className="mr-1" />
                      {order.bookingsCount} Bookings
                    </span>
                    <div className="text-sm text-gray-600 mt-1">
                      {order.tourCount} Tours, {order.transferCount} Transfers
                    </div>
                  </div>
                  <div className="md:col-span-4 flex items-center justify-end gap-2">
                    <button
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition flex items-center"
                      onClick={() => handleViewOrderDetails(order)}
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </button>
                    <button
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition flex items-center"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowAddBookingModal(true);
                      }}
                    >
                      <Plus size={16} className="mr-1" />
                      Add Booking
                    </button>
                    <button
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition flex items-center"
                      onClick={() => {
                        setOrderToDelete(order);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{" "}
              {filteredOrders.length} orders
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-3 py-1.5 border rounded-md flex items-center disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                className="px-3 py-1.5 border rounded-md flex items-center disabled:opacity-50"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                Order #{selectedOrder.reference_id || selectedOrder.id}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Order Summary */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Order Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Customer:
                      </span>{" "}
                      {`${selectedOrder.first_name || ""} ${
                        selectedOrder.last_name || ""
                      }`.trim() || "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Agent:</span>{" "}
                      {selectedOrder.agent_name || "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Status:</span>{" "}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          selectedOrder.is_invoiced
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedOrder.is_invoiced
                          ? "Invoiced"
                          : "Not Invoiced"}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Date Range:
                      </span>{" "}
                      {getDateRangeDisplay(selectedOrder)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Total Bookings:
                      </span>{" "}
                      {orderBookings.length} (
                      {
                        orderBookings.filter((b) => b.bookingType === "tour")
                          .length
                      }{" "}
                      Tours,{" "}
                      {
                        orderBookings.filter(
                          (b) => b.bookingType === "transfer"
                        ).length
                      }{" "}
                      Transfers)
                    </p>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    Bookings
                  </h4>
                  <BookingStatusLegend />
                </div>
                {orderBookings.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    No bookings found for this order.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderBookings.map((booking) => {
                      const isTour = booking.bookingType === "tour";
                      const statusClasses = {
                        pending: "bg-gray-200 text-gray-800",
                        booked: "bg-blue-100 text-blue-800",
                        in_progress: "bg-yellow-100 text-yellow-800",
                        completed: "bg-green-100 text-green-800",
                        cancelled: "bg-red-100 text-red-800",
                      };
                      const statusClass =
                        statusClasses[booking.status] || statusClasses.pending;

                      return (
                        <div
                          key={booking.id}
                          className="bg-white border rounded-lg shadow-sm overflow-hidden"
                        >
                          <div
                            className={`px-4 py-2 flex justify-between items-center ${
                              isTour ? "bg-green-50" : "bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {isTour ? "Tour" : "Transfer"} #
                                {booking.reference_id || booking.id}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}
                              >
                                {booking.status || "Pending"}
                              </span>
                            </div>
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() => {
                                setBookingToRemove({
                                  bookingId: booking.id,
                                  bookingType: booking.bookingType,
                                });
                                setShowRemoveBookingConfirm(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Common Information */}
                              <div className="space-y-2">
                                <p className="text-sm">
                                  <span className="font-medium">Date:</span>{" "}
                                  {formatDisplayDate(booking.date)}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">Time:</span>{" "}
                                  {booking.time || "N/A"}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">Pax:</span>{" "}
                                  {booking.pax || "N/A"}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">Send To:</span>{" "}
                                  {(isTour
                                    ? booking.send_to
                                    : booking.send_to) || "N/A"}
                                </p>
                              </div>

                              {/* Specific Information */}
                              <div className="space-y-2">
                                {isTour ? (
                                  <>
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Tour Type:
                                      </span>{" "}
                                      {booking.tour_type || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Hotel:
                                      </span>{" "}
                                      {booking.tour_hotel || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Room No:
                                      </span>{" "}
                                      {booking.tour_room_no || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Contact:
                                      </span>{" "}
                                      {booking.tour_contact_no || "N/A"}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Transfer Type:
                                      </span>{" "}
                                      {booking.transfer_type || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Pickup:
                                      </span>{" "}
                                      {booking.pickup_location || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium">Drop:</span>{" "}
                                      {booking.drop_location || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium">
                                        Flight:
                                      </span>{" "}
                                      {booking.transfer_flight || "N/A"}
                                    </p>
                                  </>
                                )}
                              </div>

                              {/* Additional Information */}
                              <div className="space-y-2">
                                <p className="text-sm">
                                  <span className="font-medium">Details:</span>{" "}
                                  {(isTour
                                    ? booking.tour_detail
                                    : booking.transfer_detail) || "N/A"}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">Note:</span>{" "}
                                  {booking.note || "N/A"}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">
                                    Cost Price:
                                  </span>{" "}
                                  {booking.cost_price || "N/A"}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">
                                    Selling Price:
                                  </span>{" "}
                                  {booking.selling_price || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg flex justify-between items-center">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedOrder(selectedOrder);
                  setShowAddBookingModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ยืนยันการนำ Booking ออกจาก Order */}
      {showRemoveBookingConfirm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-red-600 text-white rounded-t-lg">
              <h3 className="text-xl font-semibold">Remove Booking</h3>
              <button
                onClick={() => setShowRemoveBookingConfirm(false)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                คุณต้องการเอา booking นี้ออกจาก Order ใช่หรือไม่?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRemoveBookingConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmRemoveBooking}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  เอาออก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ยืนยันการลบ Order */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-red-600 text-white rounded-t-lg">
              <h3 className="text-xl font-semibold">Delete Order</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                คุณต้องการลบออเดอร์นี้ใช่หรือไม่? การลบจะทำให้ Booking ใน Order
                ถูกปลดออกทั้งหมด และ Order จะถูกลบถาวร
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmDeleteOrder}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* โมดัลสำหรับ Add Booking */}
      {showAddBookingModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-lg">
              <h3 className="text-xl font-semibold">
                Add Booking to Order{" "}
                {selectedOrder.reference_id || `#${selectedOrder.id}`}
              </h3>
              <button
                onClick={() => setShowAddBookingModal(false)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* ส่วนเลือก Booking ที่ว่างอยู่เพื่อนำมาใส่ Order */}
            <div className="p-6">
              <p className="mb-4 text-gray-700">
                เลือก Booking ที่ต้องการเพิ่มในออเดอร์นี้
              </p>
              {availableBookings.length === 0 ? (
                <p className="text-gray-500">
                  ไม่มี Booking ที่ว่างอยู่ในขณะนี้
                </p>
              ) : (
                <div className="space-y-3">
                  {availableBookings.map((booking) => {
                    const isSelected = selectedBookingsToAdd.some(
                      (b) => b.id === booking.id && b.type === booking.type
                    );
                    return (
                      <label
                        key={`${booking.type}-${booking.id}`}
                        className={`flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition ${
                          isSelected
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mr-3"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              // เอาออกจาก list
                              setSelectedBookingsToAdd((prev) =>
                                prev.filter(
                                  (b) =>
                                    !(
                                      b.id === booking.id &&
                                      b.type === booking.type
                                    )
                                )
                              );
                            } else {
                              // เพิ่มเข้า list
                              setSelectedBookingsToAdd((prev) => [
                                ...prev,
                                booking,
                              ]);
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium">
                            {booking.type === "tour"
                              ? "Tour Booking"
                              : "Transfer Booking"}
                            : #{booking.id}
                          </p>
                          <p className="text-sm text-gray-600">
                            Date: {booking.date} • Time: {booking.time || "-"} •
                            Customer: {booking.customer || "-"} • Pax:{" "}
                            {booking.pax || 0}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ปุ่มกดด้านล่างของ Modal */}
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowAddBookingModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleAddBookingsToOrder(selectedOrder.id)}
                disabled={selectedBookingsToAdd.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                เพิ่ม Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOrders;
