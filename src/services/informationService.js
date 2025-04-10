// src/services/informationService.js
import supabase from "../config/supabaseClient";

/**
 * ดึงข้อมูลทั้งหมดจากตาราง information
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const fetchAllInformation = async () => {
  try {
    const { data, error } = await supabase
      .from("information")
      .select("*")
      .order("category")
      .order("value");

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching information:", error);
    return { data: [], error: error.message };
  }
};

/**
 * ดึงข้อมูลตาม category
 * @param {string} category - ประเภทข้อมูล (agent, tour_recipient, transfer_recipient, tour_type, transfer_type, hotel, pickup_location, driver_name)
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const fetchInformationByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from("information")
      .select("*")
      .eq("category", category)
      .eq("active", true)
      .order("value");

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error fetching ${category} information:`, error);
    return { data: [], error: error.message };
  }
};

/**
 * เพิ่มข้อมูลใหม่
 * @param {Object} informationData - ข้อมูลที่ต้องการเพิ่ม
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
// src/services/informationService.js
// แก้ไขฟังก์ชัน addInformation ให้รองรับ description
export const addInformation = async (informationData) => {
  try {
    // ลบการตรวจสอบหมวดหมู่เก่าทั้งหมด
    const { data, error } = await supabase
      .from("information")
      .insert(informationData)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error adding information:", error);
    return { data: null, error: error.message };
  }
};

/**
 * อัปเดตข้อมูล
 * @param {number} id - ID ของข้อมูล
 * @param {Object} updatedData - ข้อมูลที่ต้องการอัปเดต
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export const updateInformation = async (id, updatedData) => {
  try {
    const { error } = await supabase
      .from("information")
      .update(updatedData)
      .eq("id", id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating information:", error);
    return { success: false, error: error.message };
  }
};

/**
 * ลบข้อมูล (soft delete โดยการตั้งค่า active = false)
 * @param {number} id - ID ของข้อมูล
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export const deactivateInformation = async (id) => {
  try {
    const { error } = await supabase
      .from("information")
      .update({ active: false })
      .eq("id", id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deactivating information:", error);
    return { success: false, error: error.message };
  }
};
