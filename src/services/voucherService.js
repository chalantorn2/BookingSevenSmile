// src/services/voucherService.js
import supabase from "../config/supabaseClient";

/**
 * ดึงข้อมูล voucher ตาม ID
 * @param {string} voucherId - ID ของ voucher
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export const fetchVoucherById = async (voucherId) => {
  try {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("id", voucherId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching voucher:", error);
    return { data: null, error: error.message };
  }
};

/**
 * ดึงข้อมูล voucher ทั้งหมด
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export const fetchAllVouchers = async () => {
  try {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    return { data: null, error: error.message };
  }
};

/**
 * สร้าง voucher ใหม่
 * @param {Object} voucherData - ข้อมูล voucher ที่จะสร้าง
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export const createVoucher = async (voucherData) => {
  try {
    // ตรวจสอบว่า Booking มี Voucher อยู่แล้วหรือไม่
    const { data: existingVoucher, error: voucherError } = await supabase
      .from("vouchers")
      .select("id")
      .eq("booking_id", voucherData.booking_id)
      .eq("booking_type", voucherData.booking_type)
      .single();

    if (existingVoucher && !voucherError) {
      throw new Error("Booking นี้มี Voucher อยู่แล้ว");
    }
    if (voucherError && voucherError.code !== "PGRST116") {
      throw voucherError;
    }

    // หาเลขที่ voucher ล่าสุดในปีปัจจุบัน
    const currentYear = new Date().getFullYear();
    const { data: sequenceData, error: sequenceError } = await supabase
      .from("sequences")
      .select("*")
      .eq("key", `voucher_${currentYear}`)
      .single();

    let nextSequence = 1;

    if (sequenceError) {
      if (sequenceError.code === "PGRST116") {
        const { data: newSequence, error: insertError } = await supabase
          .from("sequences")
          .insert({ key: `voucher_${currentYear}`, value: 1 })
          .select()
          .single();

        if (insertError) throw insertError;
      } else {
        throw sequenceError;
      }
    } else {
      nextSequence = sequenceData.value + 1;

      const { error: updateError } = await supabase
        .from("sequences")
        .update({ value: nextSequence })
        .eq("key", `voucher_${currentYear}`);

      if (updateError) throw updateError;
    }

    const voucherNumber = String(nextSequence).padStart(4, "0");

    const voucherWithNumbers = {
      ...voucherData,
      year_number: currentYear.toString(),
      sequence_number: voucherNumber,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("vouchers")
      .insert(voucherWithNumbers)
      .select()
      .single();

    if (error) throw error;

    if (voucherData.booking_id && voucherData.booking_type) {
      const tableName =
        voucherData.booking_type === "tour"
          ? "tour_bookings"
          : "transfer_bookings";

      await supabase
        .from(tableName)
        .update({ voucher_created: true })
        .eq("id", voucherData.booking_id);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error creating voucher:", error);
    return { data: null, error: error.message };
  }
};

/**
 * อัพเดต voucher
 * @param {string} voucherId - ID ของ voucher
 * @param {Object} updateData - ข้อมูลที่จะอัพเดต
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateVoucher = async (voucherId, updateData) => {
  try {
    const { error } = await supabase
      .from("vouchers")
      .update(updateData)
      .eq("id", voucherId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating voucher:", error);
    return { success: false, error: error.message };
  }
};

/**
 * ลบ voucher
 * @param {string} voucherId - ID ของ voucher
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteVoucher = async (voucherId) => {
  try {
    // ดึงข้อมูล voucher เพื่อหา booking ที่เกี่ยวข้อง
    const { data: voucher, error: fetchError } = await supabase
      .from("vouchers")
      .select("*")
      .eq("id", voucherId)
      .single();

    if (fetchError) throw fetchError;

    // อัพเดตสถานะ voucher_created ใน booking กลับเป็น false
    if (voucher.booking_id && voucher.booking_type) {
      const tableName =
        voucher.booking_type === "tour" ? "tour_bookings" : "transfer_bookings";

      await supabase
        .from(tableName)
        .update({ voucher_created: false })
        .eq("id", voucher.booking_id);
    }

    // ลบ voucher
    const { error } = await supabase
      .from("vouchers")
      .delete()
      .eq("id", voucherId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting voucher:", error);
    return { success: false, error: error.message };
  }
};
