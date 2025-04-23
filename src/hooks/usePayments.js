import { useState, useEffect } from "react";
import supabase from "../config/supabaseClient";
import { fetchPaymentByOrderId, savePayment } from "../services/paymentService";

/**
 * Custom hook for handling payment operations
 */
const usePayments = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tourBookings, setTourBookings] = useState([]);
  const [transferBookings, setTransferBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [paymentTotals, setPaymentTotals] = useState({
    totalCost: 0,
    totalSellingPrice: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load order's bookings
  const loadOrderBookings = async (orderId) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch tour bookings
      const { data: tourData, error: tourError } = await supabase
        .from("tour_bookings")
        .select("*")
        .eq("order_id", orderId);

      if (tourError) throw tourError;

      // Fetch transfer bookings
      const { data: transferData, error: transferError } = await supabase
        .from("transfer_bookings")
        .select("*")
        .eq("order_id", orderId);

      if (transferError) throw transferError;

      // Check for existing payment data
      const { data: paymentData } = await fetchPaymentByOrderId(orderId);

      setTourBookings(tourData || []);
      setTransferBookings(transferData || []);

      // If payment exists, load selected bookings
      if (paymentData && paymentData.bookings) {
        // Convert bookings from object to array if needed
        const bookingsArray = Array.isArray(paymentData.bookings)
          ? paymentData.bookings
          : Object.values(paymentData.bookings);

        setSelectedBookings(bookingsArray);

        // Set payment totals
        setPaymentTotals({
          totalCost: paymentData.total_cost || 0,
          totalSellingPrice: paymentData.total_selling_price || 0,
          totalProfit: paymentData.total_profit || 0,
        });
      } else {
        setSelectedBookings([]);
        setPaymentTotals({
          totalCost: 0,
          totalSellingPrice: 0,
          totalProfit: 0,
        });
      }

      return {
        tourBookings: tourData || [],
        transferBookings: transferData || [],
      };
    } catch (error) {
      console.error("Error loading order bookings:", error);
      setError("ไม่สามารถโหลดข้อมูลการจองได้");
      return { tourBookings: [], transferBookings: [] };
    } finally {
      setLoading(false);
    }
  };

  // ในฟังก์ชัน addBookingToPayment ของไฟล์ usePayments.js

  const addBookingToPayment = (booking, type) => {
    // Check if booking is already added
    const existingIndex = selectedBookings.findIndex(
      (b) => b.id === booking.id && b.type === type
    );

    if (existingIndex !== -1) {
      // Update existing booking count
      const updatedBookings = [...selectedBookings];
      updatedBookings[existingIndex].chosenCount =
        (updatedBookings[existingIndex].chosenCount || 0) + 1;
      setSelectedBookings(updatedBookings);
    } else {
      // Prepare booking data based on type
      const bookingData = {
        id: booking.id,
        dbKey: booking.id,
        type: type,
        date: type === "tour" ? booking.tour_date : booking.transfer_date,
        detail: type === "tour" ? booking.tour_detail : booking.transfer_detail,
        hotel: type === "tour" ? booking.tour_hotel : "",
        sendTo: type === "tour" ? booking.send_to : booking.send_to,
        pax: booking.pax || 1,
        cost: booking.cost_price || 0, // ใช้ค่า cost_price ที่มากับ booking
        quantity: booking.pax || 1,
        sellingPrice: booking.selling_price || 0, // ใช้ค่า selling_price ที่มากับ booking
        status: booking.payment_status === "paid" ? "paid" : "notPaid", // แปลงค่า payment_status
        remark: "",
        bookingType: "",
        chosenCount: 1,
      };

      // Add to selected bookings
      setSelectedBookings([...selectedBookings, bookingData]);
    }
  };

  // Remove booking from payment calculation
  const removeBookingFromPayment = (index) => {
    const updatedBookings = [...selectedBookings];
    updatedBookings.splice(index, 1);
    setSelectedBookings(updatedBookings);
  };

  // Update booking field
  const updateBookingField = (index, field, value) => {
    const updatedBookings = [...selectedBookings];
    updatedBookings[index][field] = value;
    setSelectedBookings(updatedBookings);
  };

  // Calculate payment totals
  const calculateTotals = (bookings = selectedBookings) => {
    let totalCost = 0;
    let totalSellingPrice = 0;

    bookings.forEach((booking) => {
      const cost = parseFloat(booking.cost) || 0;
      const quantity = parseInt(booking.quantity) || 0;
      const sellingPrice = parseFloat(booking.sellingPrice) || 0;

      totalCost += cost * quantity;
      totalSellingPrice += sellingPrice * quantity;
    });

    const totalProfit = totalSellingPrice - totalCost;

    setPaymentTotals({
      totalCost,
      totalSellingPrice,
      totalProfit,
    });

    return {
      totalCost,
      totalSellingPrice,
      totalProfit,
    };
  };

  // Save payment data
  const savePaymentData = async (order) => {
    if (!order) {
      throw new Error("กรุณาเลือก Order ก่อนบันทึกข้อมูล");
    }

    if (selectedBookings.length === 0) {
      throw new Error("กรุณาเลือก Booking อย่างน้อย 1 รายการ");
    }

    setLoading(true);

    try {
      const paymentID = `P_${order.reference_id || order.id}`;
      const totals = calculateTotals();

      const paymentData = {
        payment_id: paymentID,
        order_id: order.id,
        first_name: order.first_name || "",
        last_name: order.last_name || "",
        agent_name: order.agent_name || "",
        pax: order.pax || 0,
        bookings: selectedBookings,
        total_cost: totals.totalCost,
        total_selling_price: totals.totalSellingPrice,
        total_profit: totals.totalProfit,
        invoiced: false,
      };

      const result = await savePayment(paymentData);

      if (!result.success) {
        throw new Error(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      return { success: true, paymentID };
    } catch (error) {
      console.error("Error saving payment:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update calculations when selected bookings change
  useEffect(() => {
    calculateTotals();
  }, [selectedBookings]);

  return {
    // State
    selectedOrder,
    tourBookings,
    transferBookings,
    selectedBookings,
    paymentTotals,
    loading,
    error,

    // Actions
    setSelectedOrder,
    loadOrderBookings,
    addBookingToPayment,
    removeBookingFromPayment,
    updateBookingField,
    calculateTotals,
    savePaymentData,
    setError,
  };
};

export default usePayments;
