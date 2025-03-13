import supabase from "../config/supabaseClient";

/**
 * สร้าง Order ID ในรูปแบบ AGENT-YYMMDD-XXX
 * @param {string} agent ชื่อ agent ที่จะใช้เป็น prefix
 * @returns {Promise<string>} Order ID ที่สร้างขึ้น
 */
export async function generateOrderID(agent = "SEVEN") {
  try {
    // รูปแบบ: AGENT-YYMMDD-XXX
    const today = new Date();
    const yy = today.getFullYear().toString().slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const monthKey = `${yy}${mm}`;

    // ปรับชื่อ agent ให้ปลอดภัยสำหรับใช้ใน ID
    const safeAgent = agent.replace(/\//g, "-");

    // ใช้ Supabase ในการ query sequence ล่าสุด
    const { data: sequenceData, error } = await supabase
      .from("sequences")
      .select("*")
      .eq("key", `order_${monthKey}`)
      .single();

    let sequence = 1;

    if (error) {
      // ถ้าไม่พบ sequence ให้สร้างใหม่
      if (error.code === "PGRST116") {
        const { data: newSequence, error: insertError } = await supabase
          .from("sequences")
          .insert({ key: `order_${monthKey}`, value: 1 })
          .single();

        if (insertError) throw insertError;
      } else {
        throw error;
      }
    } else {
      // ถ้าพบ sequence ให้เพิ่มค่าขึ้น 1
      sequence = sequenceData.value + 1;

      const { error: updateError } = await supabase
        .from("sequences")
        .update({ value: sequence })
        .eq("key", `order_${monthKey}`);

      if (updateError) throw updateError;
    }

    return `${safeAgent}-${yy}${mm}${dd}-${String(sequence).padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating order ID:", error);
    throw error;
  }
}

/**
 * สร้าง Booking ID สำหรับ tour หรือ transfer ในรูปแบบ T-YYYY-M-XXXX หรือ Tr-YYYY-M-XXXX
 * @param {string} type ประเภทของ booking ('tour' หรือ 'transfer')
 * @returns {Promise<string>} Booking ID ที่สร้างขึ้น
 */
export async function generateBookingID(type) {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // เดือนเริ่มจาก 0

    // สร้าง key สำหรับเก็บในฐานข้อมูล
    const sequenceKey = `booking_${year}_${month}`;

    // ใช้ Supabase ในการ query sequence ล่าสุด
    const { data: sequenceData, error } = await supabase
      .from("sequences")
      .select("*")
      .eq("key", sequenceKey)
      .single();

    let sequence = 1;

    if (error) {
      // ถ้าไม่พบ sequence ให้สร้างใหม่
      if (error.code === "PGRST116") {
        const { data: newSequence, error: insertError } = await supabase
          .from("sequences")
          .insert({ key: sequenceKey, value: 1 })
          .single();

        if (insertError) throw insertError;
      } else {
        throw error;
      }
    } else {
      // ถ้าพบ sequence ให้เพิ่มค่าขึ้น 1
      sequence = sequenceData.value + 1;

      const { error: updateError } = await supabase
        .from("sequences")
        .update({ value: sequence })
        .eq("key", sequenceKey);

      if (updateError) throw updateError;
    }

    // สร้าง prefix ตามประเภท
    const prefix = type.toLowerCase() === "tour" ? "T" : "Tr";

    // สร้าง ID ในรูปแบบ T-YYYY-M-XXXX หรือ Tr-YYYY-M-XXXX
    return `${prefix}-${year}-${month}-${String(sequence).padStart(4, "0")}`;
  } catch (error) {
    console.error(`Error generating ${type} booking ID:`, error);
    throw error;
  }
}
