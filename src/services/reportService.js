import ExcelJS from "exceljs";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { th } from "date-fns/locale";

const generateFileName = (
  selectedMonth,
  exportRange,
  exportFormat,
  selectedFilters
) => {
  const monthEng = format(new Date(selectedMonth), "MMMM");
  const year = format(new Date(selectedMonth), "yyyy");
  const rangeTextEng = getRangeTextEng(exportRange);
  const dateCreated = format(new Date(), "yyyyMMdd");

  const agentCount = selectedFilters.agents?.length || 0;
  const tourCount = selectedFilters.tourRecipients?.length || 0;
  const transferCount = selectedFilters.transferRecipients?.length || 0;
  const totalFilters = agentCount + tourCount + transferCount;

  let filterText = "";

  if (totalFilters > 1) {
    const filterParts = [];
    if (agentCount > 0)
      filterParts.push(`${agentCount}agent${agentCount > 1 ? "s" : ""}`);
    if (tourCount > 0)
      filterParts.push(`${tourCount}tour${tourCount > 1 ? "s" : ""}`);
    if (transferCount > 0)
      filterParts.push(
        `${transferCount}transfer${transferCount > 1 ? "s" : ""}`
      );
    filterText = filterParts.join("-");
  } else if (totalFilters === 1) {
    if (agentCount === 1) filterText = selectedFilters.agents[0];
    else if (tourCount === 1)
      filterText = `Tour${selectedFilters.tourRecipients[0]}`;
    else if (transferCount === 1)
      filterText = `Transfer${selectedFilters.transferRecipients[0]}`;
  } else {
    filterText = "รวม";
  }

  return `Report${filterText}${monthEng}${year}${rangeTextEng}${dateCreated}.xlsx`;
};

/**
 * ฟังก์ชันสำหรับ export รายงานเป็นไฟล์ Excel
 * @param {Array} tourBookings - รายการจอง tour
 * @param {Array} transferBookings - รายการจอง transfer
 * @param {string} selectedMonth - เดือนที่เลือก (YYYY-MM)
 * @param {string} exportRange - ช่วงเวลา (first_15, last_15, full_month)
 * @param {string} exportFormat - รูปแบบ (combined, separate)
 * @param {string} filterType - ประเภทตัวกรอง (agent, tour_recipient, transfer_recipient)
 * @param {string} selectedTourRecipient - ผู้รับ tour ที่เลือก
 * @param {string} selectedTransferRecipient - ผู้รับ transfer ที่เลือก
 */
export const exportReportToExcel = async (
  tourBookings,
  transferBookings,
  selectedMonth,
  exportRange,
  exportFormat = "combined",
  filterType = "agent",
  selectedTourRecipient = "",
  selectedTransferRecipient = "",
  selectedFilters = {
    agents: [],
    tourRecipients: [],
    transferRecipients: [],
  }
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SevenSmile Booking System";
    workbook.lastModifiedBy = "SevenSmile";
    workbook.created = new Date();
    workbook.modified = new Date();

    const filteredTourBookings = filterBookingsByRange(
      tourBookings,
      selectedMonth,
      exportRange,
      "tour"
    );
    const filteredTransferBookings = filterBookingsByRange(
      transferBookings,
      selectedMonth,
      exportRange,
      "transfer"
    );

    const monthName = format(new Date(selectedMonth), "MMMM", { locale: th });
    const year = format(new Date(selectedMonth), "yyyy");
    const rangeTextEng = getRangeTextEng(exportRange);

    let typeText = "รวม";
    let reportName = "รายการ Bookings";
    if (exportFormat === "separate") {
      if (filteredTourBookings.length > 0) {
        typeText =
          filterType === "tour_recipient" && selectedTourRecipient
            ? `Tour${selectedTourRecipient}`
            : "Tour";
        reportName =
          filterType === "tour_recipient" && selectedTourRecipient
            ? `รายการ Bookings Tour ${selectedTourRecipient}`
            : "รายการ Bookings Tour";
      } else if (filteredTransferBookings.length > 0) {
        typeText =
          filterType === "transfer_recipient" && selectedTransferRecipient
            ? `Transfer${selectedTransferRecipient}`
            : "Transfer";
        reportName =
          filterType === "transfer_recipient" && selectedTransferRecipient
            ? `รายการ Bookings Transfer ${selectedTransferRecipient}`
            : "รายการ Bookings Transfer";
      }
    } else if (filterType === "tour_recipient" && selectedTourRecipient) {
      typeText = `Tour${selectedTourRecipient}`;
      reportName = `รายการ Bookings Tour ${selectedTourRecipient}`;
    } else if (
      filterType === "transfer_recipient" &&
      selectedTransferRecipient
    ) {
      typeText = `Transfer${selectedTransferRecipient}`;
      reportName = `รายการ Bookings Transfer ${selectedTransferRecipient}`;
    }

    const fileName = generateFileName(
      selectedMonth,
      exportRange,
      exportFormat,
      selectedFilters
    );

    const hasTour = filteredTourBookings.length > 0;
    const hasTransfer = filteredTransferBookings.length > 0;

    if (!hasTour && !hasTransfer) {
      throw new Error("ไม่มีข้อมูลสำหรับ Export");
    }

    if (exportFormat === "separate") {
      if (hasTour) {
        const tourWorksheet = workbook.addWorksheet("Tour Bookings");
        await setupTourSheet(
          tourWorksheet,
          filteredTourBookings,
          monthName,
          year,
          exportRange,
          filterType,
          selectedTourRecipient
        );
      }

      if (hasTransfer) {
        const transferWorksheet = workbook.addWorksheet("Transfer Bookings");
        await setupTransferSheet(
          transferWorksheet,
          filteredTransferBookings,
          monthName,
          year,
          exportRange,
          filterType,
          selectedTransferRecipient
        );
      }
    } else {
      const worksheet = workbook.addWorksheet(monthName);
      await setupCombinedSheet(
        worksheet,
        filteredTourBookings,
        filteredTransferBookings,
        monthName,
        year,
        exportRange,
        reportName
      );
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      fileName,
      message: `ส่งออกรายงานสำเร็จ: ${fileName}`,
    };
  } catch (error) {
    console.error("Error exporting report to Excel:", error);
    return {
      success: false,
      error: error.message,
      message: "เกิดข้อผิดพลาดในการส่งออกรายงาน",
    };
  }
};

const filterBookingsByRange = (bookings, selectedMonth, exportRange, type) => {
  if (!bookings || bookings.length === 0) return [];

  const monthStart = startOfMonth(new Date(selectedMonth));
  const monthEnd = endOfMonth(new Date(selectedMonth));

  let startDate, endDate;

  switch (exportRange) {
    case "first_15":
      startDate = monthStart;
      endDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), 15);
      break;
    case "last_15":
      startDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), 16);
      endDate = monthEnd;
      break;
    case "full_month":
    default:
      startDate = monthStart;
      endDate = monthEnd;
      break;
  }

  const dateField = type === "tour" ? "tour_date" : "transfer_date";

  return bookings.filter((booking) => {
    const bookingDate = new Date(booking[dateField]);
    return bookingDate >= startDate && bookingDate <= endDate;
  });
};

const getRangeText = (exportRange) => {
  switch (exportRange) {
    case "first_15":
      return "15 วันแรก";
    case "last_15":
      return "15 วันหลัง";
    case "full_month":
    default:
      return "ทั้งเดือน";
  }
};

const getRangeTextEng = (exportRange) => {
  switch (exportRange) {
    case "first_15":
      return "First15Days";
    case "last_15":
      return "Last15Days";
    case "full_month":
    default:
      return "FullMonth";
  }
};

const setupCombinedSheet = async (
  worksheet,
  tourBookings,
  transferBookings,
  monthName,
  year,
  exportRange,
  reportName
) => {
  const allBookings = [
    ...tourBookings.map((b) => ({
      ...b,
      type: "tour",
      date: b.tour_date,
      time: b.tour_pickup_time,
    })),
    ...transferBookings.map((b) => ({
      ...b,
      type: "transfer",
      date: b.transfer_date,
      time: b.transfer_time,
    })),
  ];

  const groupedByDate = {};
  allBookings.forEach((booking) => {
    const dateKey = booking.date;
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(booking);
  });

  const sortedDates = Object.keys(groupedByDate).sort();

  worksheet.getCell("A1").value = reportName;
  worksheet.getCell("A1").font = {
    size: 16,
    bold: true,
    color: { argb: "FF000000" },
  };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.getCell("A2").value = `${monthName} ${year} (${getRangeText(
    exportRange
  )})`;
  worksheet.getCell("A2").font = {
    size: 14,
    bold: true,
    color: { argb: "FF000000" },
  };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.mergeCells("A1:P1");
  worksheet.mergeCells("A2:P2");

  let currentRow = 4;
  const columnWidths = Array(16).fill(10);

  for (const dateKey of sortedDates) {
    let bookingsOfDate = groupedByDate[dateKey];
    bookingsOfDate = bookingsOfDate.sort((a, b) => {
      const timeA = a.time || "23:59";
      const timeB = b.time || "23:59";
      return timeA.localeCompare(timeB);
    });

    const dateCell = worksheet.getCell(currentRow, 1);
    dateCell.value = `วันที่ ${format(new Date(dateKey), "dd/MM/yyyy")}`;
    dateCell.font = {
      size: 14,
      bold: true,
      color: { argb: "FF000000" },
    };
    dateCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    currentRow++;

    const headers = [
      "ลำดับ",
      "ประเภท",
      "Agent",
      "ชื่อลูกค้า",
      "จำนวนคน",
      "เวลารับ",
      "รับจาก",
      "ส่งที่",
      "เที่ยวบิน",
      "เวลาบิน",
      "ส่งใคร",
      "หมายเหตุ",
      "",
      "Cost",
      "Sell",
      "Profit",
    ];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      if (header !== "") {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF6B7280" },
        };
      }
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (index !== 12) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
      columnWidths[index] = Math.max(columnWidths[index], header.length * 1.2);
    });
    currentRow++;

    bookingsOfDate.forEach((booking, index) => {
      const rowData = prepareCombinedRowData(booking, index + 1);
      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;
        cell.alignment = { vertical: "middle", wrapText: true };
        if (colIndex !== 12) {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
        if (colIndex >= 13 && colIndex <= 15) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFED7AA" },
          };
        }
        if (index % 2 === 0 && colIndex < 13) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8F9FA" },
          };
        }
        columnWidths[colIndex] = Math.max(
          columnWidths[colIndex],
          String(value).length * 1.2
        );
      });
      currentRow++;
    });
    currentRow++;
  }

  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = Math.min(Math.max(width, 10), 50);
  });

  worksheet.getRow(1).height = 25;
  worksheet.getRow(2).height = 20;

  currentRow++;
  const totalCost = allBookings.reduce(
    (sum, b) => sum + (parseFloat(b.cost_price) || 0),
    0
  );
  const totalSell = allBookings.reduce(
    (sum, b) => sum + (parseFloat(b.selling_price) || 0),
    0
  );
  const totalProfit = totalSell - totalCost;

  worksheet.getCell(currentRow, 1).value = "สรุป";
  worksheet.getCell(currentRow, 1).font = { bold: true };
  worksheet.getCell(currentRow, 1).alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`);

  worksheet.getCell(currentRow, 14).value = totalCost.toLocaleString();
  worksheet.getCell(currentRow, 15).value = totalSell.toLocaleString();
  worksheet.getCell(currentRow, 16).value = totalProfit.toLocaleString();

  [14, 15, 16].forEach((colIndex) => {
    const cell = worksheet.getCell(currentRow, colIndex);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFED7AA" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    cell.font = { bold: true };
  });
};

const setupTransferSheet = async (
  worksheet,
  transferBookings,
  monthName,
  year,
  exportRange,
  filterType,
  selectedTransferRecipient
) => {
  const groupedByDate = {};
  transferBookings.forEach((booking) => {
    const dateKey = booking.transfer_date;
    if (dateKey && !isNaN(new Date(dateKey).getTime())) {
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(booking);
    }
  });

  const sortedDates = Object.keys(groupedByDate).sort();

  const reportName =
    filterType === "transfer_recipient" && selectedTransferRecipient
      ? `รายการ Bookings Transfer ${selectedTransferRecipient}`
      : "รายการ Bookings Transfer";
  worksheet.getCell("A1").value = reportName;
  worksheet.getCell("A1").font = {
    size: 16,
    bold: true,
    color: { argb: "FF2563EB" },
  };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.getCell("A2").value = `${monthName} ${year} (${getRangeText(
    exportRange
  )})`;
  worksheet.getCell("A2").font = {
    size: 14,
    bold: true,
    color: { argb: "FF000000" },
  };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.mergeCells("A1:O1");
  worksheet.mergeCells("A2:O2");

  let currentRow = 4;
  const columnWidths = Array(15).fill(10);

  for (const dateKey of sortedDates) {
    let bookingsOfDate = groupedByDate[dateKey];
    bookingsOfDate = bookingsOfDate.sort((a, b) => {
      const timeA = a.transfer_time || "23:59";
      const timeB = b.transfer_time || "23:59";
      return timeA.localeCompare(timeB);
    });

    const dateCell = worksheet.getCell(currentRow, 1);
    dateCell.value = `วันที่ ${format(new Date(dateKey), "dd/MM/yyyy")}`;
    dateCell.font = {
      size: 14,
      bold: true,
      color: { argb: "FF000000" },
    };
    dateCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };
    worksheet.mergeCells(`A${currentRow}:O${currentRow}`);
    currentRow++;

    const transferHeaders = [
      "ลำดับ",
      "Agent",
      "ชื่อลูกค้า",
      "จำนวนคน",
      "เวลารับ",
      "รับจาก",
      "ส่งที่",
      "เที่ยวบิน",
      "เวลาบิน",
      "ส่งใคร",
      "หมายเหตุ",
      "",
      "Cost",
      "Sell",
      "Profit",
    ];

    transferHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      if (header !== "") {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2563EB" },
        };
      }
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (index !== 11) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
      columnWidths[index] = Math.max(columnWidths[index], header.length * 1.2);
    });
    currentRow++;

    bookingsOfDate.forEach((booking, index) => {
      const rowData = prepareTransferRowData(booking, index + 1);
      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;
        cell.alignment = { vertical: "middle", wrapText: true };
        if (colIndex !== 11) {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
        if (colIndex >= 12 && colIndex <= 14) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFED7AA" },
          };
        }
        if (index % 2 === 0 && colIndex < 12) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8F9FA" },
          };
        }
        columnWidths[colIndex] = Math.max(
          columnWidths[colIndex],
          String(value).length * 1.2
        );
      });
      currentRow++;
    });
    currentRow++;
  }

  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = Math.min(Math.max(width, 10), 50);
  });

  worksheet.getRow(1).height = 25;
  worksheet.getRow(2).height = 20;

  currentRow++;
  const totalCost = transferBookings.reduce(
    (sum, b) => sum + (parseFloat(b.cost_price) || 0),
    0
  );
  const totalSell = transferBookings.reduce(
    (sum, b) => sum + (parseFloat(b.selling_price) || 0),
    0
  );
  const totalProfit = totalSell - totalCost;

  worksheet.getCell(currentRow, 1).value = "สรุป";
  worksheet.getCell(currentRow, 1).font = { bold: true };
  worksheet.getCell(currentRow, 1).alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  worksheet.mergeCells(`A${currentRow}:L${currentRow}`);

  worksheet.getCell(currentRow, 13).value = totalCost.toLocaleString();
  worksheet.getCell(currentRow, 14).value = totalSell.toLocaleString();
  worksheet.getCell(currentRow, 15).value = totalProfit.toLocaleString();

  [13, 14, 15].forEach((colIndex) => {
    const cell = worksheet.getCell(currentRow, colIndex);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFED7AA" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    cell.font = { bold: true };
  });
};

const setupTourSheet = async (
  worksheet,
  tourBookings,
  monthName,
  year,
  exportRange,
  filterType,
  selectedTourRecipient
) => {
  const groupedByDate = {};
  tourBookings.forEach((booking) => {
    const dateKey = booking.tour_date;
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(booking);
  });

  const sortedDates = Object.keys(groupedByDate).sort();

  const reportName =
    filterType === "tour_recipient" && selectedTourRecipient
      ? `รายการ Bookings Tour ${selectedTourRecipient}`
      : "รายการ Bookings Tour";
  worksheet.getCell("A1").value = reportName;
  worksheet.getCell("A1").font = {
    size: 16,
    bold: true,
    color: { argb: "FF16A34A" },
  };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.getCell("A2").value = `${monthName} ${year} (${getRangeText(
    exportRange
  )})`;
  worksheet.getCell("A2").font = {
    size: 14,
    bold: true,
    color: { argb: "FF000000" },
  };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.mergeCells("A1:M1");
  worksheet.mergeCells("A2:M2");

  let currentRow = 4;
  const columnWidths = Array(13).fill(10);

  for (const dateKey of sortedDates) {
    let bookingsOfDate = groupedByDate[dateKey];
    bookingsOfDate = bookingsOfDate.sort((a, b) => {
      const timeA = a.tour_pickup_time || "23:59";
      const timeB = b.tour_pickup_time || "23:59";
      return timeA.localeCompare(timeB);
    });

    const dateCell = worksheet.getCell(currentRow, 1);
    dateCell.value = `วันที่ ${format(new Date(dateKey), "dd/MM/yyyy")}`;
    dateCell.font = {
      size: 14,
      bold: true,
      color: { argb: "FF000000" },
    };
    dateCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };
    worksheet.mergeCells(`A${currentRow}:M${currentRow}`);
    currentRow++;

    const tourHeaders = [
      "ลำดับ",
      "Agent",
      "ชื่อลูกค้า",
      "จำนวนคน",
      "เวลารับ",
      "โรงแรม",
      "รายละเอียด",
      "ส่งใคร",
      "หมายเหตุ",
      "",
      "Cost",
      "Sell",
      "Profit",
    ];

    tourHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      if (header !== "") {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF16A34A" },
        };
      }
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (index !== 9) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
      columnWidths[index] = Math.max(columnWidths[index], header.length * 1.2);
    });
    currentRow++;

    bookingsOfDate.forEach((booking, index) => {
      const rowData = prepareTourRowData(booking, index + 1);
      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 1);
        cell.value = value;
        cell.alignment = { vertical: "middle", wrapText: true };
        if (colIndex !== 9) {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
        if (colIndex >= 10 && colIndex <= 12) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFED7AA" },
          };
        }
        if (index % 2 === 0 && colIndex < 10) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8F9FA" },
          };
        }
        columnWidths[colIndex] = Math.max(
          columnWidths[colIndex],
          String(value).length * 1.2
        );
      });
      currentRow++;
    });
    currentRow++;
  }

  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = Math.min(Math.max(width, 10), 50);
  });

  worksheet.getRow(1).height = 25;
  worksheet.getRow(2).height = 20;

  currentRow++;
  const totalCost = tourBookings.reduce(
    (sum, b) => sum + (parseFloat(b.cost_price) || 0),
    0
  );
  const totalSell = tourBookings.reduce(
    (sum, b) => sum + (parseFloat(b.selling_price) || 0),
    0
  );
  const totalProfit = totalSell - totalCost;

  worksheet.getCell(currentRow, 1).value = "สรุป";
  worksheet.getCell(currentRow, 1).font = { bold: true };
  worksheet.getCell(currentRow, 1).alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`);

  worksheet.getCell(currentRow, 11).value = totalCost.toLocaleString();
  worksheet.getCell(currentRow, 12).value = totalSell.toLocaleString();
  worksheet.getCell(currentRow, 13).value = totalProfit.toLocaleString();

  [11, 12, 13].forEach((colIndex) => {
    const cell = worksheet.getCell(currentRow, colIndex);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFED7AA" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    cell.font = { bold: true };
  });
};

const prepareCombinedRowData = (booking, index) => {
  const firstName = booking.orders?.first_name || "";
  const lastName = booking.orders?.last_name || "";
  const customerName = `${firstName} ${lastName}`.trim() || "ไม่มีชื่อ";

  const formatPax = () => {
    if (booking.orders) {
      const adtCount = parseInt(booking.orders.pax_adt || 0);
      const chdCount = parseInt(booking.orders.pax_chd || 0);
      const infCount = parseInt(booking.orders.pax_inf || 0);

      let paxParts = [];
      if (adtCount > 0) paxParts.push(adtCount.toString());
      if (chdCount > 0) paxParts.push(chdCount.toString());
      if (infCount > 0) paxParts.push(infCount.toString());

      return paxParts.length > 0 ? paxParts.join("+") : "0";
    }
    return booking.pax || "0";
  };

  const cost = parseFloat(booking.cost_price) || 0;
  const sell = parseFloat(booking.selling_price) || 0;
  const profit = sell - cost;

  let detail1, detail2, flight, flightTime, time;

  if (booking.type === "tour") {
    detail1 = booking.tour_hotel || "-";
    detail2 = booking.tour_detail || "-";
    flight = "-";
    flightTime = "-";
    time = booking.tour_pickup_time || "-";
  } else {
    detail1 = booking.pickup_location || "-";
    detail2 = booking.drop_location || "-";
    flight = booking.transfer_flight || "-";
    flightTime = booking.transfer_ftime || "-";
    time = booking.transfer_time || "-";
  }

  return [
    index,
    booking.type === "tour" ? "Tour" : "Transfer",
    booking.orders?.agent_name || "ไม่ระบุ Agent",
    customerName,
    formatPax(),
    time,
    detail1,
    detail2,
    flight,
    flightTime,
    booking.send_to || "-",
    booking.note || "-",
    "",
    cost.toLocaleString(),
    sell.toLocaleString(),
    profit.toLocaleString(),
  ];
};

const prepareTourRowData = (booking, index) => {
  const firstName = booking.orders?.first_name || "";
  const lastName = booking.orders?.last_name || "";
  const customerName = `${firstName} ${lastName}`.trim() || "ไม่มีชื่อ";

  const formatPax = () => {
    if (booking.orders) {
      const adtCount = parseInt(booking.orders.pax_adt || 0);
      const chdCount = parseInt(booking.orders.pax_chd || 0);
      const infCount = parseInt(booking.orders.pax_inf || 0);

      let paxParts = [];
      if (adtCount > 0) paxParts.push(adtCount.toString());
      if (chdCount > 0) paxParts.push(chdCount.toString());
      if (infCount > 0) paxParts.push(infCount.toString());

      return paxParts.length > 0 ? paxParts.join("+") : "0";
    }
    return booking.pax || "0";
  };

  const cost = parseFloat(booking.cost_price) || 0;
  const sell = parseFloat(booking.selling_price) || 0;
  const profit = sell - cost;

  return [
    index,
    booking.orders?.agent_name || "ไม่ระบุ Agent",
    customerName,
    formatPax(),
    booking.tour_pickup_time || "-",
    booking.tour_hotel || "-",
    booking.tour_detail || "-",
    booking.send_to || "-",
    booking.note || "-",
    "",
    cost.toLocaleString(),
    sell.toLocaleString(),
    profit.toLocaleString(),
  ];
};

const prepareTransferRowData = (booking, index) => {
  const firstName = booking.orders?.first_name || "";
  const lastName = booking.orders?.last_name || "";
  const customerName = `${firstName} ${lastName}`.trim() || "ไม่มีชื่อ";

  const formatPax = () => {
    if (booking.orders) {
      const adtCount = parseInt(booking.orders.pax_adt || 0);
      const chdCount = parseInt(booking.orders.pax_chd || 0);
      const infCount = parseInt(booking.orders.pax_inf || 0);

      let paxParts = [];
      if (adtCount > 0) paxParts.push(adtCount.toString());
      if (chdCount > 0) paxParts.push(chdCount.toString());
      if (infCount > 0) paxParts.push(infCount.toString());

      return paxParts.length > 0 ? paxParts.join("+") : "0";
    }
    return booking.pax || "0";
  };

  const cost = parseFloat(booking.cost_price) || 0;
  const sell = parseFloat(booking.selling_price) || 0;
  const profit = sell - cost;

  return [
    index,
    booking.orders?.agent_name || "ไม่ระบุ Agent",
    customerName,
    formatPax(),
    booking.transfer_time || "-",
    booking.pickup_location || "-",
    booking.drop_location || "-",
    booking.transfer_flight || "-",
    booking.transfer_ftime || "-",
    booking.send_to || "-",
    booking.note || "-",
    "",
    cost.toLocaleString(),
    sell.toLocaleString(),
    profit.toLocaleString(),
  ];
};
