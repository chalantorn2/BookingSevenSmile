// src/pages/Voucher.jsx
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import supabase from "../config/supabaseClient";
import { useNotification } from "../hooks/useNotification";
import { useAlertDialogContext } from "../contexts/AlertDialogContext";
import {
  Search,
  Calendar,
  Filter,
  RefreshCcw,
  Plus,
  Edit,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
} from "lucide-react";

const Voucher = () => {
  const showAlert = useAlertDialogContext();
  const { showSuccess, showError, showInfo } = useNotification();

  // State variables
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and sorting states
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // ย้อนหลัง 1 เดือน
    return format(date, "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => {
    return format(new Date(), "yyyy-MM-dd");
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterType, setFilterType] = useState("all"); // 'all', 'tour', 'transfer'
  const [voucherStatus, setVoucherStatus] = useState("all"); // 'all', 'created', 'not_created'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Load bookings on initial render and when filters change
  useEffect(() => {
    fetchBookings();
  }, [
    startDate,
    endDate,
    filterType,
    voucherStatus,
    sortField,
    sortDirection,
    currentPage,
  ]);

  // Fetch bookings from database
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch tour bookings
      const tourPromise = supabase
        .from("tour_bookings")
        .select(
          `
          *,
          orders:order_id (
            id, first_name, last_name, agent_name, reference_id
          )
        `
        )
        .gte("tour_date", startDate)
        .lte("tour_date", endDate);

      // Fetch transfer bookings
      const transferPromise = supabase
        .from("transfer_bookings")
        .select(
          `
          *,
          orders:order_id (
            id, first_name, last_name, agent_name, reference_id
          )
        `
        )
        .gte("transfer_date", startDate)
        .lte("transfer_date", endDate);

      // Apply filter by type
      if (filterType === "tour") {
        transferPromise.limit(0);
      } else if (filterType === "transfer") {
        tourPromise.limit(0);
      }

      // Apply filter by voucher status if needed
      // Assuming we have voucher_status field or similar
      if (voucherStatus === "created") {
        tourPromise.eq("voucher_created", true);
        transferPromise.eq("voucher_created", true);
      } else if (voucherStatus === "not_created") {
        tourPromise.eq("voucher_created", false).is("voucher_created", null);
        transferPromise
          .eq("voucher_created", false)
          .is("voucher_created", null);
      }

      // Execute both promises
      const [tourResult, transferResult] = await Promise.all([
        tourPromise,
        transferPromise,
      ]);

      if (tourResult.error) throw tourResult.error;
      if (transferResult.error) throw transferResult.error;

      // Process and combine the results
      const tourBookings = (tourResult.data || []).map((booking) => ({
        ...booking,
        type: "tour",
        booking_date: booking.tour_date,
        booking_type: booking.tour_type,
        recipient: booking.send_to,
        created_at: booking.created_at,
        // Set voucher status (assuming we have these fields, adjust as needed)
        voucher_status: booking.voucher_created ? "created" : "not_created",
      }));

      const transferBookings = (transferResult.data || []).map((booking) => ({
        ...booking,
        type: "transfer",
        booking_date: booking.transfer_date,
        booking_type: booking.transfer_type,
        recipient: booking.send_to,
        created_at: booking.created_at,
        // Set voucher status (assuming we have these fields, adjust as needed)
        voucher_status: booking.voucher_created ? "created" : "not_created",
      }));

      // Combine bookings
      let combinedBookings = [...tourBookings, ...transferBookings];

      // Apply search filter if needed
      if (searchTerm) {
        combinedBookings = combinedBookings.filter((booking) => {
          const customerName = booking.orders
            ? `${booking.orders.first_name} ${booking.orders.last_name}`.toLowerCase()
            : "";

          return (
            customerName.includes(searchTerm.toLowerCase()) ||
            (booking.recipient &&
              booking.recipient
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            (booking.booking_type &&
              booking.booking_type
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            (booking.reference_id &&
              booking.reference_id
                .toLowerCase()
                .includes(searchTerm.toLowerCase()))
          );
        });
      }

      // Sort the bookings
      combinedBookings.sort((a, b) => {
        let valueA, valueB;

        // Determine the values to compare based on sortField
        switch (sortField) {
          case "recipient":
            valueA = a.recipient || "";
            valueB = b.recipient || "";
            break;
          case "customer":
            valueA = a.orders
              ? `${a.orders.first_name} ${a.orders.last_name}`
              : "";
            valueB = b.orders
              ? `${b.orders.first_name} ${b.orders.last_name}`
              : "";
            break;
          case "booking_type":
            valueA = a.booking_type || "";
            valueB = b.booking_type || "";
            break;
          case "booking_date":
            valueA = a.booking_date || "";
            valueB = b.booking_date || "";
            break;
          case "voucher_status":
            valueA = a.voucher_status || "not_created";
            valueB = b.voucher_status || "not_created";
            break;
          case "created_at":
          default:
            valueA = a.created_at || "";
            valueB = b.created_at || "";
            break;
        }

        // Perform the comparison
        if (valueA < valueB) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });

      // Calculate pagination
      const totalItems = combinedBookings.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      setTotalPages(totalPages);

      // Get current page items
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedBookings = combinedBookings.slice(
        startIndex,
        startIndex + itemsPerPage
      );

      setBookings(paginatedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("ไม่สามารถโหลดข้อมูลการจองได้");
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sort changes
  };

  // Handle searching
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search term changes
  };

  // Apply date filters
  const applyDateFilter = () => {
    setCurrentPage(1); // Reset to first page when filter changes
    fetchBookings();
  };

  // Handle pagination
  const changePage = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle create voucher
  const handleCreateVoucher = async (booking) => {
    // Navigate to Create Voucher page or open modal
    showInfo(`กำลังสร้าง Voucher สำหรับการจอง ID: ${booking.reference_id}`);
    // TODO: Implement create voucher functionality
  };

  // Handle edit voucher
  const handleEditVoucher = async (booking) => {
    // Navigate to Edit Voucher page or open modal
    showInfo(`กำลังแก้ไข Voucher สำหรับการจอง ID: ${booking.id}`);
    // TODO: Implement edit voucher functionality
  };

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch (error) {
      return dateStr;
    }
  };

  // Display customer name
  const getCustomerName = (booking) => {
    if (!booking.orders) return "-";
    return (
      `${booking.orders.first_name || ""} ${
        booking.orders.last_name || ""
      }`.trim() || "-"
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">ระบบออก Voucher</h1>
        <p className="text-gray-600">ค้นหาและจัดการ Voucher สำหรับการจอง</p>
      </div>

      {/* Filter section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">ค้นหาและกรอง</h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          {/* Date filters */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่เริ่มต้น
            </label>
            <div className="relative">
              <Calendar
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                className="pl-10 w-full border border-gray-300 rounded-lg p-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่สิ้นสุด
            </label>
            <div className="relative">
              <Calendar
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                className="pl-10 w-full border border-gray-300 rounded-lg p-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Type filter */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภท
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="tour">Tour</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          {/* Voucher status filter */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              สถานะ Voucher
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={voucherStatus}
              onChange={(e) => {
                setVoucherStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="created">สร้างแล้ว</option>
              <option value="not_created">ยังไม่สร้าง</option>
            </select>
          </div>

          {/* Apply button */}
          <div className="md:col-span-2 flex items-end">
            <button
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
              onClick={applyDateFilter}
            >
              <Filter size={18} className="mr-2" />
              กรอง
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อลูกค้า, ผู้รับ, ประเภท..."
            className="pl-10 w-full border border-gray-300 rounded-lg p-2"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Bookings table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">รายการการจองทั้งหมด</h2>
          <button
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition flex items-center"
            onClick={() => fetchBookings()}
          >
            <RefreshCcw size={16} className="mr-2" />
            รีเฟรช
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>ไม่พบข้อมูลการจอง</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Column headers with sorting */}
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">
                      <span>ลำดับ</span>
                      {sortField === "created_at" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("recipient")}
                  >
                    <div className="flex items-center">
                      <span>ส่งใคร</span>
                      {sortField === "recipient" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("customer")}
                  >
                    <div className="flex items-center">
                      <span>ชื่อลูกค้า</span>
                      {sortField === "customer" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("booking_type")}
                  >
                    <div className="flex items-center">
                      <span>ประเภท</span>
                      {sortField === "booking_type" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("booking_date")}
                  >
                    <div className="flex items-center">
                      <span>วันที่</span>
                      {sortField === "booking_date" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("voucher_status")}
                  >
                    <div className="flex items-center">
                      <span>สถานะ Voucher</span>
                      {sortField === "voucher_status" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สร้าง Voucher
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    แก้ไข Voucher
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking, index) => (
                  <tr
                    key={`${booking.type}-${booking.id}`}
                    className={
                      booking.type === "tour" ? "bg-green-50" : "bg-blue-50"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.recipient || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {getCustomerName(booking)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.type === "tour"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {booking.booking_type ||
                          (booking.type === "tour" ? "Tour" : "Transfer")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {formatDateDisplay(booking.booking_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.voucher_status === "created"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        <span className="flex items-center">
                          {booking.voucher_status === "created" ? (
                            <>
                              <CheckCircle size={14} className="mr-1" />
                              สร้างแล้ว
                            </>
                          ) : (
                            <>
                              <XCircle size={14} className="mr-1" />
                              ยังไม่สร้าง
                            </>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {booking.voucher_status !== "created" && (
                        <button
                          onClick={() => handleCreateVoucher(booking)}
                          className={`px-3 py-1 rounded ${
                            booking.type === "tour"
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          <span className="flex items-center">
                            <Plus size={14} className="mr-1" />
                            สร้าง
                          </span>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {booking.voucher_status === "created" && (
                        <button
                          onClick={() => handleEditVoucher(booking)}
                          className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
                        >
                          <span className="flex items-center">
                            <Edit size={14} className="mr-1" />
                            แก้ไข
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              แสดง {(currentPage - 1) * itemsPerPage + 1} ถึง{" "}
              {Math.min(
                currentPage * itemsPerPage,
                bookings.length + (currentPage - 1) * itemsPerPage
              )}{" "}
              จากทั้งหมด {totalPages * itemsPerPage} รายการ
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md flex items-center disabled:opacity-50"
              >
                <ChevronLeft size={16} className="mr-1" />
                ก่อนหน้า
              </button>

              {/* Page numbers */}
              <div className="flex space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;

                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => changePage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "border text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md flex items-center disabled:opacity-50"
              >
                ถัดไป
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Voucher;
