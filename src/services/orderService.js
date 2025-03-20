import supabase from "../config/supabaseClient";
import { generateOrderID } from "../utils/idGenerator";

/**
 * ดึงข้อมูล orders ทั้งหมด
 * @returns {Promise<{orders: Array, error: string|null}>}
 */
export const fetchAllOrders = async () => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { orders: data || [], error: null };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { orders: [], error: error.message };
  }
};

/**
 * ดึงข้อมูล order ตาม ID
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

    return { order: data, error: null };
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
 * สร้าง order ใหม่
 * @param {Object} orderData - ข้อมูล order ที่ต้องการสร้าง
 * @returns {Promise<{success: boolean, order: Object|null, error: string|null}>}
 */
export const createOrder = async (orderData) => {
  try {
    // สร้าง reference_id
    const reference_id = await generateOrderID(orderData.agent_name || "SEVEN");

    // ข้อมูลที่จะบันทึก
    const newOrder = {
      reference_id,
      first_name: orderData.first_name || "",
      last_name: orderData.last_name || "",
      agent_name: orderData.agent_name || "",
      pax: orderData.pax || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(newOrder)
      .select()
      .single();

    if (error) throw error;

    return { success: true, order: data, error: null };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, order: null, error: error.message };
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

    const { error } = await supabase
      .from("orders")
      .update(updatedData)
      .eq("id", id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
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

    // รวมการอัปเดตทั้งหมดในธุรกรรมเดียว
    const updates = {};

    // อัปเดต tour bookings - ลบการเชื่อมโยงกับ order
    for (const booking of tourBookings) {
      const { error: tourError } = await supabase
        .from("tour_bookings")
        .update({ order_id: null })
        .eq("id", booking.id);

      if (tourError) throw tourError;
    }

    // อัปเดต transfer bookings - ลบการเชื่อมโยงกับ order
    for (const booking of transferBookings) {
      const { error: transferError } = await supabase
        .from("transfer_bookings")
        .update({ order_id: null })
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
 * เพิ่ม booking เข้าไปใน order
 * @param {number} orderId - ID ของ order
 * @param {Object} bookingData - ข้อมูล booking ที่ต้องการเพิ่ม (ต้องมีฟิลด์ id และ type)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const addBookingToOrder = async (orderId, bookingData) => {
  try {
    const { id: bookingId, type } = bookingData;
    const tableName = type === "tour" ? "tour_bookings" : "transfer_bookings";

    // อัปเดต booking ให้เชื่อมโยงกับ order
    const { error } = await supabase
      .from(tableName)
      .update({ order_id: orderId })
      .eq("id", bookingId);

    if (error) throw error;

    // อัปเดตวันที่ของ order หากไม่มีการตั้งค่าไว้
    const { order, error: orderError } = await fetchOrderById(orderId);

    if (orderError) throw new Error(orderError);

    // ถ้าไม่มีวันที่ในออเดอร์ ให้อัปเดตจาก booking
    if (order && (!order.start_date || !order.end_date)) {
      // ดึงวันที่จาก booking
      let bookingDate;
      if (type === "tour") {
        const { data, error: fetchError } = await supabase
          .from("tour_bookings")
          .select("tour_date")
          .eq("id", bookingId)
          .single();

        if (fetchError) throw fetchError;
        bookingDate = data?.tour_date;
      } else {
        const { data, error: fetchError } = await supabase
          .from("transfer_bookings")
          .select("transfer_date")
          .eq("id", bookingId)
          .single();

        if (fetchError) throw fetchError;
        bookingDate = data?.transfer_date;
      }

      // อัปเดตวันที่ order ถ้ามีวันที่
      if (bookingDate) {
        const updateData = {
          updated_at: new Date().toISOString(),
        };

        if (
          !order.start_date ||
          new Date(bookingDate) < new Date(order.start_date)
        ) {
          updateData.start_date = bookingDate;
        }

        if (
          !order.end_date ||
          new Date(bookingDate) > new Date(order.end_date)
        ) {
          updateData.end_date = bookingDate;
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", orderId);

        if (updateError) throw updateError;
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error adding booking to order ${orderId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * ลบ booking ออกจาก order
 * @param {number} orderId - ID ของ order
 * @param {Object} bookingInfo - ข้อมูล booking ที่ต้องการลบ (ต้องมีฟิลด์ bookingId และ bookingType)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const removeBookingFromOrder = async (orderId, bookingInfo) => {
  try {
    const { bookingId, bookingType } = bookingInfo;
    const tableName =
      bookingType === "tour" ? "tour_bookings" : "transfer_bookings";

    // อัปเดต booking ให้ไม่เชื่อมโยงกับ order
    const { error } = await supabase
      .from(tableName)
      .update({ order_id: null })
      .eq("id", bookingId);

    if (error) throw error;

    // ตรวจสอบและอัปเดตวันที่ของ order ถ้าจำเป็น
    await updateOrderDates(orderId);

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error removing booking from order ${orderId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * อัปเดตวันที่ของ order ให้ตรงกับวันที่เร็วสุดและช้าสุดของ bookings
 * @param {number} orderId - ID ของ order
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateOrderDates = async (orderId) => {
  try {
    // ดึงข้อมูล bookings ทั้งหมดของ order
    const {
      tourBookings,
      transferBookings,
      error: fetchError,
    } = await fetchOrderBookings(orderId);

    if (fetchError) throw new Error(fetchError);

    // รวมวันที่ทั้งหมดจาก bookings
    const allDates = [
      ...tourBookings.map((booking) => booking.tour_date),
      ...transferBookings.map((booking) => booking.transfer_date),
    ].filter((date) => date); // กรองเฉพาะวันที่ที่มีค่า

    if (allDates.length === 0) {
      // ไม่มี bookings หรือไม่มีวันที่
      return { success: true, error: null };
    }

    // เรียงลำดับวันที่
    allDates.sort((a, b) => new Date(a) - new Date(b));

    // อัปเดต order ด้วยวันที่เร็วสุดและช้าสุด
    const { error } = await supabase
      .from("orders")
      .update({
        start_date: allDates[0],
        end_date: allDates[allDates.length - 1],
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error updating order dates for ${orderId}:`, error);
    return { success: false, error: error.message };
  }
};
