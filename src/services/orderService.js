import supabase from "../config/supabaseClient";
import { generateOrderID } from "../utils/idGenerator";

/**
 * ดึงข้อมูล orders ทั้งหมด พร้อมจำนวน bookings และ vouchers
 * @returns {Promise<{orders: Array, error: string|null}>}
 */
export const fetchAllOrders = async () => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Process orders to include booking counts and vouchers
    const processedOrders = await Promise.all(
      data.map(async (order) => {
        // Count tour bookings
        const { data: tourBookings, error: tourError } = await supabase
          .from("tour_bookings")
          .select("id")
          .eq("order_id", order.id);

        if (tourError) throw tourError;

        // Count transfer bookings
        const { data: transferBookings, error: transferError } = await supabase
          .from("transfer_bookings")
          .select("id")
          .eq("order_id", order.id);

        if (transferError) throw transferError;

        // Get vouchers related to this order's bookings
        const tourIds = (tourBookings || []).map((b) => b.id);
        const transferIds = (transferBookings || []).map((b) => b.id);

        let vouchers = [];

        if (tourIds.length > 0) {
          const { data: tourVouchers } = await supabase
            .from("vouchers")
            .select("*")
            .eq("booking_type", "tour")
            .in("booking_id", tourIds);

          if (tourVouchers) {
            vouchers = [...vouchers, ...tourVouchers];
          }
        }

        if (transferIds.length > 0) {
          const { data: transferVouchers } = await supabase
            .from("vouchers")
            .select("*")
            .eq("booking_type", "transfer")
            .in("booking_id", transferIds);

          if (transferVouchers) {
            vouchers = [...vouchers, ...transferVouchers];
          }
        }

        return {
          ...order,
          tourCount: tourBookings ? tourBookings.length : 0,
          transferCount: transferBookings ? transferBookings.length : 0,
          bookingsCount:
            (tourBookings ? tourBookings.length : 0) +
            (transferBookings ? transferBookings.length : 0),
          vouchers,
        };
      })
    );

    return { orders: processedOrders || [], error: null };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { orders: [], error: error.message };
  }
};

/**
 * ดึงข้อมูล order ตาม ID พร้อมข้อมูลการจองและ vouchers
 * @param {number} id - ID ของ order
 * @returns {Promise<{order: Object|null, error: string|null}>}
 */
export const fetchOrderById = async (id) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // ดึงข้อมูล tour bookings
    const { data: tourBookings, error: tourError } = await supabase
      .from("tour_bookings")
      .select("*")
      .eq("order_id", id);

    if (tourError) throw tourError;

    // ดึงข้อมูล transfer bookings
    const { data: transferBookings, error: transferError } = await supabase
      .from("transfer_bookings")
      .select("*")
      .eq("order_id", id);

    if (transferError) throw transferError;

    // Get vouchers related to this order's bookings
    const tourIds = (tourBookings || []).map((b) => b.id);
    const transferIds = (transferBookings || []).map((b) => b.id);

    let vouchers = [];

    if (tourIds.length > 0) {
      const { data: tourVouchers } = await supabase
        .from("vouchers")
        .select("*")
        .eq("booking_type", "tour")
        .in("booking_id", tourIds);

      if (tourVouchers) {
        vouchers = [...vouchers, ...tourVouchers];
      }
    }

    if (transferIds.length > 0) {
      const { data: transferVouchers } = await supabase
        .from("vouchers")
        .select("*")
        .eq("booking_type", "transfer")
        .in("booking_id", transferIds);

      if (transferVouchers) {
        vouchers = [...vouchers, ...transferVouchers];
      }
    }

    return {
      order: {
        ...data,
        tourBookings: tourBookings || [],
        transferBookings: transferBookings || [],
        vouchers: vouchers || [],
      },
      error: null,
    };
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return { order: null, error: error.message };
  }
};

/**
 * ดึงข้อมูล bookings ทั้งหมดของ order
 * @param {number} orderId - ID ของ order
 * @returns {Promise<{tourBookings: Array, transferBookings: Array, error: string|null}>}
 */
export const fetchOrderBookings = async (orderId) => {
  try {
    // ดึงข้อมูลทัวร์
    const { data: tourData, error: tourError } = await supabase
      .from("tour_bookings")
      .select("*")
      .eq("order_id", orderId);

    if (tourError) throw tourError;

    // ดึงข้อมูลรถรับส่ง
    const { data: transferData, error: transferError } = await supabase
      .from("transfer_bookings")
      .select("*")
      .eq("order_id", orderId);

    if (transferError) throw transferError;

    return {
      tourBookings: tourData || [],
      transferBookings: transferData || [],
      error: null,
    };
  } catch (error) {
    console.error(`Error fetching bookings for order ${orderId}:`, error);
    return {
      tourBookings: [],
      transferBookings: [],
      error: error.message,
    };
  }
};

/**
 * อัปเดต order
 * @param {number} id - ID ของ order ที่ต้องการอัปเดต
 * @param {Object} orderData - ข้อมูลที่ต้องการอัปเดต
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateOrder = async (id, orderData) => {
  try {
    // อัปเดตเวลาแก้ไข
    const updatedData = {
      ...orderData,
      updated_at: new Date().toISOString(),
    };

    // ลบข้อมูลที่ไม่ต้องการบันทึกลงในตาราง orders
    const { tourBookings, transferBookings, vouchers, ...dataToUpdate } =
      updatedData;

    const { error } = await supabase
      .from("orders")
      .update(dataToUpdate)
      .eq("id", id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * อัปเดตหมายเหตุของ order
 * @param {number} id - ID ของ order
 * @param {string} note - หมายเหตุที่ต้องการอัปเดต
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateOrderNote = async (id, note) => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error updating order note ${id}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * อัปเดตสถานะของ order
 * @param {number} id - ID ของ order
 * @param {boolean} completed - สถานะความเรียบร้อย
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateOrderStatus = async (id, completed) => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error updating order status ${id}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * ลบ order
 * @param {number} id - ID ของ order ที่ต้องการลบ
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteOrder = async (id) => {
  try {
    // ดึงข้อมูล bookings ทั้งหมดของ order
    const {
      tourBookings,
      transferBookings,
      error: fetchError,
    } = await fetchOrderBookings(id);

    if (fetchError) throw new Error(fetchError);

    // ลบ tour bookings
    for (const booking of tourBookings) {
      const { error: tourError } = await supabase
        .from("tour_bookings")
        .delete()
        .eq("id", booking.id);

      if (tourError) throw tourError;
    }

    // ลบ transfer bookings
    for (const booking of transferBookings) {
      const { error: transferError } = await supabase
        .from("transfer_bookings")
        .delete()
        .eq("id", booking.id);

      if (transferError) throw transferError;
    }

    // ลบ order
    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * ดึงข้อมูล orders ตามช่วงวันที่และคำค้นหา
 * @param {Object} params - พารามิเตอร์สำหรับการค้นหา
 * @param {string} params.startDate - วันที่เริ่มต้น (YYYY-MM-DD)
 * @param {string} params.endDate - วันที่สิ้นสุด (YYYY-MM-DD)
 * @param {string} params.searchTerm - คำค้นหา
 * @param {string} params.filterType - ประเภทการกรอง (all, completed, incomplete)
 * @returns {Promise<{orders: Array, error: string|null}>}
 */
export const searchOrders = async ({
  startDate,
  endDate,
  searchTerm,
  filterType,
}) => {
  try {
    // ดึงข้อมูล orders ทั้งหมด
    let query = supabase.from("orders").select("*");

    // ถ้ามี filterType ที่ไม่ใช่ 'all'
    if (filterType === "completed") {
      query = query.eq("completed", true);
    } else if (filterType === "incomplete") {
      query = query.eq("completed", false);
    }

    // ดึงข้อมูล
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    // Filter orders by date range and search term
    let filteredOrders = [...data];

    if (startDate && endDate) {
      // ทำการกรองตามวันที่
      const start = new Date(startDate);
      const end = new Date(endDate);

      const ordersWithBookings = await Promise.all(
        filteredOrders.map(async (order) => {
          // ดึงข้อมูล bookings
          const { tourBookings, transferBookings } = await fetchOrderBookings(
            order.id
          );

          // ดึงวันที่ทั้งหมดของ bookings
          const allDates = [
            ...tourBookings.map((b) => new Date(b.tour_date)),
            ...transferBookings.map((b) => new Date(b.transfer_date)),
          ].filter(Boolean);

          // ถ้าไม่มี booking หรือไม่มีวันที่ ให้ใช้วันที่ของ order
          if (allDates.length === 0) {
            if (order.start_date) allDates.push(new Date(order.start_date));
            if (order.end_date) allDates.push(new Date(order.end_date));
          }

          // ตรวจสอบว่ามีวันที่ไหนอยู่ในช่วงที่ต้องการหรือไม่
          const isInRange = allDates.some(
            (date) => date >= start && date <= end
          );

          return isInRange ? order : null;
        })
      );

      filteredOrders = ordersWithBookings.filter(Boolean);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredOrders = filteredOrders.filter(
        (order) =>
          (order.reference_id &&
            order.reference_id.toLowerCase().includes(term)) ||
          `${order.first_name || ""} ${order.last_name || ""}`
            .toLowerCase()
            .includes(term) ||
          (order.agent_name && order.agent_name.toLowerCase().includes(term))
      );
    }

    // Process filtered orders to include booking counts and vouchers
    const processedOrders = await Promise.all(
      filteredOrders.map(async (order) => {
        // Count tour bookings
        const { data: tourBookings, error: tourError } = await supabase
          .from("tour_bookings")
          .select("id")
          .eq("order_id", order.id);

        if (tourError) throw tourError;

        // Count transfer bookings
        const { data: transferBookings, error: transferError } = await supabase
          .from("transfer_bookings")
          .select("id")
          .eq("order_id", order.id);

        if (transferError) throw transferError;

        // Get vouchers related to this order's bookings
        const tourIds = (tourBookings || []).map((b) => b.id);
        const transferIds = (transferBookings || []).map((b) => b.id);

        let vouchers = [];

        if (tourIds.length > 0) {
          const { data: tourVouchers } = await supabase
            .from("vouchers")
            .select("*")
            .eq("booking_type", "tour")
            .in("booking_id", tourIds);

          if (tourVouchers) {
            vouchers = [...vouchers, ...tourVouchers];
          }
        }

        if (transferIds.length > 0) {
          const { data: transferVouchers } = await supabase
            .from("vouchers")
            .select("*")
            .eq("booking_type", "transfer")
            .in("booking_id", transferIds);

          if (transferVouchers) {
            vouchers = [...vouchers, ...transferVouchers];
          }
        }

        return {
          ...order,
          tourCount: tourBookings ? tourBookings.length : 0,
          transferCount: transferBookings ? transferBookings.length : 0,
          bookingsCount:
            (tourBookings ? tourBookings.length : 0) +
            (transferBookings ? transferBookings.length : 0),
          vouchers,
        };
      })
    );

    return { orders: processedOrders || [], error: null };
  } catch (error) {
    console.error("Error searching orders:", error);
    return { orders: [], error: error.message };
  }
};
