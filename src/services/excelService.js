import * as XLSX from "xlsx";

/**
 * ฟังก์ชันสำหรับ export ข้อมูล bookings เป็นไฟล์ Excel
 * @param {Array} tourBookings - รายการจอง tour
 * @param {Array} transferBookings - รายการจอง transfer
 * @param {string} date - วันที่ในรูปแบบ DD/MM/YYYY
 */
export const exportBookingsToExcel = (tourBookings, transferBookings, date) => {
  try {
    // สร้าง workbook ใหม่
    const workbook = XLSX.utils.book_new();

    // ======= Tour Bookings Sheet =======
    const tourData = prepareTourData(tourBookings);
    const tourWorksheet = XLSX.utils.aoa_to_sheet(tourData);

    // ตั้งค่าความกว้างของคอลัมน์ Tour
    tourWorksheet["!cols"] = [
      { wch: 8 }, // ลำดับ
      { wch: 25 }, // ชื่อลูกค้า
      { wch: 10 }, // จำนวนคน
      { wch: 12 }, // เวลารับ
      { wch: 20 }, // โรงแรม
      { wch: 12 }, // หมายเลขห้อง
      { wch: 30 }, // รายละเอียด
      { wch: 20 }, // Agent
      { wch: 20 }, // ส่งใคร
      { wch: 15 }, // สถานะ
      { wch: 20 }, // Reference ID
    ];

    // เพิ่ม sheet Tour
    XLSX.utils.book_append_sheet(workbook, tourWorksheet, "Tour Bookings");

    // ======= Transfer Bookings Sheet =======
    const transferData = prepareTransferData(transferBookings);
    const transferWorksheet = XLSX.utils.aoa_to_sheet(transferData);

    // ตั้งค่าความกว้างของคอลัมน์ Transfer
    transferWorksheet["!cols"] = [
      { wch: 8 }, // ลำดับ
      { wch: 25 }, // ชื่อลูกค้า
      { wch: 10 }, // จำนวนคน
      { wch: 12 }, // เวลารับ
      { wch: 25 }, // รับจาก
      { wch: 25 }, // ส่งที่
      { wch: 15 }, // เที่ยวบิน
      { wch: 12 }, // เวลาบิน
      { wch: 20 }, // Agent
      { wch: 20 }, // ส่งใคร
      { wch: 15 }, // สถานะ
      { wch: 20 }, // Reference ID
    ];

    // เพิ่ม sheet Transfer
    XLSX.utils.book_append_sheet(
      workbook,
      transferWorksheet,
      "Transfer Bookings"
    );

    // สร้างชื่อไฟล์
    const fileName = `daily-bookings-${date.replace(/\//g, "-")}.xlsx`;

    // บันทึกไฟล์
    XLSX.writeFile(workbook, fileName);

    return {
      success: true,
      fileName,
      message: `ส่งออกข้อมูลสำเร็จ: ${fileName}`,
    };
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return {
      success: false,
      error: error.message,
      message: "เกิดข้อผิดพลาดในการส่งออกข้อมูล",
    };
  }
};

/**
 * เตรียมข้อมูล Tour bookings สำหรับ Excel
 */
const prepareTourData = (tourBookings) => {
  // หัวตาราง
  const headers = [
    "ลำดับ",
    "ชื่อลูกค้า",
    "จำนวนคน",
    "เวลารับ",
    "โรงแรม",
    "หมายเลขห้อง",
    "รายละเอียด",
    "Agent",
    "ส่งใคร",
    "สถานะ",
    "Reference ID",
  ];

  // เรียงลำดับตามเวลารับ
  const sortedBookings = [...tourBookings].sort((a, b) => {
    const timeA = a.tour_pickup_time || "";
    const timeB = b.tour_pickup_time || "";
    return timeA.localeCompare(timeB);
  });

  // แปลงข้อมูลเป็น array
  const rows = sortedBookings.map((booking, index) => {
    const firstName = booking.orders?.first_name || "";
    const lastName = booking.orders?.last_name || "";
    const customerName = `${firstName} ${lastName}`.trim() || "ไม่มีชื่อ";

    // ฟอร์แมต Pax
    const formatPax = () => {
      if (booking.orders) {
        const adtCount = parseInt(booking.orders.pax_adt || 0);
        const chdCount = parseInt(booking.orders.pax_chd || 0);
        const infCount = parseInt(booking.orders.pax_inf || 0);

        let paxParts = [];
        if (adtCount > 0) paxParts.push(`${adtCount}`);
        if (chdCount > 0) paxParts.push(`${chdCount}`);
        if (infCount > 0) paxParts.push(`${infCount}`);

        return paxParts.length > 0 ? paxParts.join("+") : "0";
      }
      return booking.pax || "0";
    };

    // แปลสถานะ
    const translateStatus = (status) => {
      const statusMap = {
        pending: "รอดำเนินการ",
        booked: "จองแล้ว",
        in_progress: "ดำเนินการอยู่",
        completed: "เสร็จสมบูรณ์",
        cancelled: "ยกเลิก",
      };
      return statusMap[status] || status;
    };

    // ข้อมูล Agent
    const getAgentName = () => {
      if (booking.orders?.agent_info?.value) {
        const phone = booking.orders.agent_info.phone;
        return phone
          ? `${booking.orders.agent_info.value} (${phone})`
          : booking.orders.agent_info.value;
      }
      return booking.orders?.agent_name || "ไม่ระบุ Agent";
    };

    return [
      index + 1,
      customerName,
      formatPax(),
      booking.tour_pickup_time || "-",
      booking.tour_hotel || "-",
      booking.tour_room_no || "-",
      booking.tour_detail || "-",
      getAgentName(),
      booking.send_to || "-",
      translateStatus(booking.status),
      booking.reference_id || `ID: ${booking.id}`,
    ];
  });

  return [headers, ...rows];
};

/**
 * เตรียมข้อมูล Transfer bookings สำหรับ Excel
 */
const prepareTransferData = (transferBookings) => {
  // หัวตาราง
  const headers = [
    "ลำดับ",
    "ชื่อลูกค้า",
    "จำนวนคน",
    "เวลารับ",
    "รับจาก",
    "ส่งที่",
    "เที่ยวบิน",
    "เวลาบิน",
    "Agent",
    "ส่งใคร",
    "สถานะ",
    "Reference ID",
  ];

  // เรียงลำดับตามเวลารับ
  const sortedBookings = [...transferBookings].sort((a, b) => {
    const timeA = a.transfer_time || "";
    const timeB = b.transfer_time || "";
    return timeA.localeCompare(timeB);
  });

  // แปลงข้อมูลเป็น array
  const rows = sortedBookings.map((booking, index) => {
    const firstName = booking.orders?.first_name || "";
    const lastName = booking.orders?.last_name || "";
    const customerName = `${firstName} ${lastName}`.trim() || "ไม่มีชื่อ";

    // ฟอร์แมต Pax
    const formatPax = () => {
      if (booking.orders) {
        const adtCount = parseInt(booking.orders.pax_adt || 0);
        const chdCount = parseInt(booking.orders.pax_chd || 0);
        const infCount = parseInt(booking.orders.pax_inf || 0);

        let paxParts = [];
        if (adtCount > 0) paxParts.push(`${adtCount}`);
        if (chdCount > 0) paxParts.push(`${chdCount}`);
        if (infCount > 0) paxParts.push(`${infCount}`);

        return paxParts.length > 0 ? paxParts.join("+") : "0";
      }
      return booking.pax || "0";
    };

    // แปลสถานะ
    const translateStatus = (status) => {
      const statusMap = {
        pending: "รอดำเนินการ",
        booked: "จองแล้ว",
        in_progress: "ดำเนินการอยู่",
        completed: "เสร็จสมบูรณ์",
        cancelled: "ยกเลิก",
      };
      return statusMap[status] || status;
    };

    // ข้อมูล Agent
    const getAgentName = () => {
      if (booking.orders?.agent_info?.value) {
        const phone = booking.orders.agent_info.phone;
        return phone
          ? `${booking.orders.agent_info.value} (${phone})`
          : booking.orders.agent_info.value;
      }
      return booking.orders?.agent_name || "ไม่ระบุ Agent";
    };

    return [
      index + 1,
      customerName,
      formatPax(),
      booking.transfer_time || "-",
      booking.pickup_location || "-",
      booking.drop_location || "-",
      booking.transfer_flight || "-",
      booking.transfer_ftime || "-",
      getAgentName(),
      booking.send_to || "-",
      translateStatus(booking.status),
      booking.reference_id || `ID: ${booking.id}`,
    ];
  });

  return [headers, ...rows];
};
