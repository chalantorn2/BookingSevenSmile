import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import supabase from "../config/supabaseClient";
import { useNotification } from "../hooks/useNotification";
import {
  fetchAllInvoices,
  createInvoice,
  updateInvoice,
  updatePaymentsInvoiceStatus,
  fetchInvoiceById,
} from "../services/invoiceService";
import "../styles/invoice.css";
import HeaderInvoice from "../components/invoice/HeaderInvoice";
import InvoiceTable from "../components/invoice/InvoiceTable";
import InvoiceFooter from "../components/invoice/InvoiceFooter";
import SummarySection from "../components/invoice/SummarySection";
import {
  X,
  CheckSquare,
  Save,
  Edit,
  Download,
  Eye,
  Printer,
} from "lucide-react";

const formatNumberWithCommas = (num) => {
  if (num === null || num === undefined) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const Invoice = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [allPaymentsData, setAllPaymentsData] = useState([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(
    format(new Date(), "dd/MM/yyyy")
  );
  const [invoiceId, setInvoiceId] = useState("");
  const [showCostProfit, setShowCostProfit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [invoicesList, setInvoicesList] = useState([]);
  const [paymentsByMonth, setPaymentsByMonth] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalSellingPrice, setTotalSellingPrice] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [isViewingExistingInvoice, setIsViewingExistingInvoice] =
    useState(false);

  const printRef = useRef(null);

  const organizePaymentsByMonth = (payments) => {
    if (!payments || !Array.isArray(payments)) return;
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const byMonth = {};

    payments.forEach((payment) => {
      if (payment.invoiced) return;
      let paymentDate = new Date();
      if (payment.bookings && payment.bookings.length > 0) {
        const firstBooking = payment.bookings[0];
        const dateStr =
          firstBooking.date ||
          firstBooking.tour_date ||
          firstBooking.transfer_date;
        if (dateStr) paymentDate = new Date(dateStr);
      }

      const monthKey = `${
        months[paymentDate.getMonth()]
      } ${paymentDate.getFullYear()}`;
      if (!byMonth[monthKey]) byMonth[monthKey] = [];

      let startDate = null;
      let endDate = null;
      if (payment.bookings && payment.bookings.length > 0) {
        payment.bookings.forEach((booking) => {
          const dateStr =
            booking.date || booking.tour_date || booking.transfer_date;
          if (dateStr) {
            const currentDate = new Date(dateStr);
            if (!startDate || currentDate < startDate) startDate = currentDate;
            if (!endDate || currentDate > endDate) endDate = currentDate;
          }
        });
      }

      let dateRangeStr = "";
      if (startDate && endDate) {
        const formatDateShort = (date) => format(date, "dd/MM/yyyy");
        dateRangeStr =
          startDate.getTime() === endDate.getTime()
            ? ` / ${formatDateShort(startDate)}`
            : ` / ${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
      }

      byMonth[monthKey].push({
        id: payment.id,
        displayName: payment.first_name
          ? `${payment.first_name} ${payment.last_name || ""}`.trim()
          : "No Name",
        dateRangeStr,
        isChecked: selectedPaymentIds.includes(payment.id),
      });
    });

    setPaymentsByMonth(byMonth);
  };

  const handleOpenSelectModal = () => setIsSelectModalOpen(true);

  const handleConfirmSelection = () => {
    setIsSelectModalOpen(false);
    buildInvoiceTable();
  };

  const buildInvoiceTable = () => {
    if (selectedPaymentIds.length === 0) return;
    setLoading(true);
    try {
      calculateTotals();
    } catch (error) {
      console.error("Error building invoice table:", error);
      setError("เกิดข้อผิดพลาดในการสร้างตาราง Invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (selectedPaymentIds.length === 0) {
      setError("กรุณาเลือก Payment อย่างน้อย 1 รายการ");
      return;
    }
    if (!invoiceDate) {
      setError("กรุณากรอกวันที่ก่อนบันทึก Invoice");
      return;
    }

    const invoiceName = prompt("กรุณาตั้งชื่อ Invoice:");
    if (!invoiceName) {
      setError("คุณยังไม่ได้ตั้งชื่อ Invoice");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const safeGrandTotal = Number(Number(grandTotal).toFixed(2));
      const safeTotalCost = Number(Number(totalCost).toFixed(2));
      const safeTotalSellingPrice = Number(
        Number(totalSellingPrice).toFixed(2)
      );
      const safeTotalProfit = Number(Number(totalProfit).toFixed(2));

      const MAX_NUMERIC_VALUE = 1e38;
      if (
        safeGrandTotal > MAX_NUMERIC_VALUE ||
        safeTotalCost > MAX_NUMERIC_VALUE ||
        safeTotalSellingPrice > MAX_NUMERIC_VALUE ||
        safeTotalProfit > MAX_NUMERIC_VALUE
      ) {
        throw new Error("ตัวเลขมีค่าสูงเกินไป ไม่สามารถบันทึกได้");
      }

      const invoiceData = {
        invoice_name: invoiceName,
        invoice_date: invoiceDate,
        payment_ids: selectedPaymentIds,
        total_amount: safeGrandTotal.toString(),
        total_cost: safeTotalCost.toString(),
        total_selling_price: safeTotalSellingPrice.toString(),
        total_profit: safeTotalProfit.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;

      for (const paymentId of selectedPaymentIds) {
        const { error: updateError } = await supabase
          .from("payments")
          .update({ invoiced: true })
          .eq("id", paymentId);
        if (updateError)
          console.error(`Failed to update payment ${paymentId}:`, updateError);
      }

      showSuccess(`บันทึก Invoice เรียบร้อย! Invoice: ${invoiceName}`);
      setSelectedPaymentIds([]);
      setGrandTotal(0);
      setTotalCost(0);
      setTotalSellingPrice(0);
      setTotalProfit(0);
      await loadInitialData();
    } catch (error) {
      console.error("Error saving invoice:", error);
      setError(`เกิดข้อผิดพลาดในการบันทึก Invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let grandTotalSum = 0;
    let costSum = 0;
    let sellingSum = 0;
    let profitSum = 0;

    selectedPaymentIds.forEach((paymentId) => {
      const payment = allPaymentsData.find((p) => p.id === paymentId);
      if (!payment || !payment.bookings || !Array.isArray(payment.bookings))
        return;

      payment.bookings.forEach((booking) => {
        const price = parseFloat(booking.sellingPrice) || 0;
        const quantity = parseInt(booking.quantity) || 0;
        const cost = parseFloat(booking.cost) || 0;

        const rowTotal = price * quantity;
        const rowCost = cost * quantity;
        const rowProfit = rowTotal - rowCost;

        grandTotalSum += rowTotal;
        costSum += rowCost;
        sellingSum += rowTotal;
        profitSum += rowProfit;
      });
    });

    setGrandTotal(grandTotalSum);
    setTotalCost(costSum);
    setTotalSellingPrice(sellingSum);
    setTotalProfit(profitSum);

    return {
      grandTotal: grandTotalSum,
      totalCost: costSum,
      totalSellingPrice: sellingSum,
      totalProfit: profitSum,
    };
  };

  const handleViewInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchAllInvoices();
      if (error) throw error;
      if (!data || data.length === 0) {
        setError("ไม่พบข้อมูล Invoice");
        return;
      }
      setInvoicesList(data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error loading invoices:", error);
      setError("ไม่สามารถโหลดรายการ Invoice ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSelectedInvoice = async (selectedInvoiceId) => {
    if (!selectedInvoiceId) {
      setError("กรุณาเลือก Invoice ก่อน");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await fetchInvoiceById(selectedInvoiceId);
      if (error) throw error;
      if (!data) {
        setError("ไม่พบข้อมูล Invoice");
        return;
      }
      setCurrentInvoice(data);
      setInvoiceId(selectedInvoiceId);
      setInvoiceDate(data.invoice_date || format(new Date(), "dd/MM/yyyy"));
      setSelectedPaymentIds(data.payment_ids || []);
      setGrandTotal(parseFloat(data.total_amount) || 0);
      setTotalCost(parseFloat(data.total_cost) || 0);
      setTotalSellingPrice(parseFloat(data.total_selling_price) || 0);
      setTotalProfit(parseFloat(data.total_profit) || 0);
      setIsViewModalOpen(false);
    } catch (error) {
      console.error("Error loading invoice:", error);
      setError("ไม่สามารถโหลดข้อมูล Invoice ได้");
    } finally {
      setLoading(false);
      setIsViewingExistingInvoice(true);
    }
  };

  const handleEditInvoice = () => {
    if (!invoiceId) {
      setError("กรุณาเลือก Invoice ที่จะแก้ไขก่อน");
      return;
    }
    showInfo("ฟีเจอร์การแก้ไข Invoice กำลังพัฒนา");
  };

  const handleExportCsv = () => {
    try {
      const table = document.getElementById("invoiceTable");
      if (!table) {
        setError("ไม่พบตาราง Invoice");
        return;
      }
      let csv = [];
      for (let i = 0; i < table.rows.length; i++) {
        let row = [];
        for (let j = 0; j < table.rows[i].cells.length; j++) {
          let text = table.rows[i].cells[j].innerText.replace(
            /(\r\n|\n|\r)/gm,
            " "
          );
          text = text.replace(/"/g, '""');
          row.push(`"${text}"`);
        }
        csv.push(row.join(","));
      }
      const csvString = csv.join("\n");
      const BOM = "\uFEFF";
      const finalCSV = BOM + csvString;
      const blob = new Blob([finalCSV], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "invoice_export.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("นำออกข้อมูลเป็น CSV สำเร็จ");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      setError("เกิดข้อผิดพลาดในการนำออกข้อมูลเป็น CSV");
    }
  };

  const handleToggleCostProfit = () => {
    setShowCostProfit(!showCostProfit);
    buildInvoiceTable();
  };

  const handleEditRef = async (paymentId, currentRef) => {
    const newRefValue = prompt("กรุณากรอกเลข REF ใหม่:", currentRef || "");
    if (newRefValue === null) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from("payments")
        .update({ ref: newRefValue })
        .eq("id", paymentId);
      if (error) throw error;
      showSuccess("อัปเดต REF เรียบร้อย");
      buildInvoiceTable();
    } catch (error) {
      console.error("Error updating REF:", error);
      setError("ไม่สามารถอัปเดต REF ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleEditFee = async (paymentId, bookingIndex, currentFee) => {
    const newFeeValue = prompt("กรุณากรอก Fee ใหม่:", currentFee || "0");
    if (newFeeValue === null) return;
    try {
      setLoading(true);
      const payment = allPaymentsData.find((p) => p.id === paymentId);
      if (!payment || !payment.bookings || !payment.bookings[bookingIndex]) {
        throw new Error("ไม่พบข้อมูล Booking");
      }
      const bookingsCopy = JSON.parse(JSON.stringify(payment.bookings));
      bookingsCopy[bookingIndex].fee = parseFloat(newFeeValue) || 0;
      const { error } = await supabase
        .from("payments")
        .update({ bookings: bookingsCopy })
        .eq("id", paymentId);
      if (error) throw error;
      showSuccess("อัปเดต Fee เรียบร้อย");
      await loadInitialData();
      buildInvoiceTable();
    } catch (error) {
      console.error("Error updating fee:", error);
      setError("ไม่สามารถอัปเดต Fee ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoiceDate = () => {
    const newDate = prompt("กรุณากรอกวันที่ Invoice:", invoiceDate);
    if (!newDate) return;
    setInvoiceDate(newDate);
    if (invoiceId) {
      updateInvoice(invoiceId, { invoice_date: newDate })
        .then(({ success }) => {
          if (success) showSuccess("อัปเดตวันที่ Invoice เรียบร้อย");
        })
        .catch((error) => {
          console.error("Error updating invoice date:", error);
          setError("ไม่สามารถอัปเดตวันที่ Invoice ได้");
        });
    }
  };

  const handlePrint = () => {
    // สร้าง document ใหม่สำหรับการพิมพ์
    const printWindow = window.open("", "_blank");

    // สร้าง HTML สำหรับส่วนที่จะพิมพ์
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice Print</title>
        <style>
          /* รีเซ็ตสไตล์ */
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          /* สไตล์หลัก */
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            padding: 10mm;
          }
          
          /* สไตล์ตาราง */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 3px;
          }
          
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          
          /* สไตล์ส่วนหัวและท้าย */
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
          }
          
          .invoice-header-right {
            text-align: right;
          }
          
          .invoice-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
          }
          
          /* สไตล์แถวสรุป */
          .total-row {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          
          .grand-total-row {
            background-color: #f0fff4;
            font-weight: bold;
          }
          
          /* การกำหนดขนาดคอลัมน์ */
          table th:nth-child(1), table td:nth-child(1) { width: 30px; }  /* Item */
          table th:nth-child(2), table td:nth-child(2) { width: 130px; } /* NAME */
          table th:nth-child(3), table td:nth-child(3) { width: 40px; }  /* REF */
          table th:nth-child(4), table td:nth-child(4) { width: 80px; }  /* Hotel */
          table th:nth-child(5), table td:nth-child(5) { width: 70px; }  /* Date */
          table th:nth-child(6), table td:nth-child(6) { width: 150px; } /* TOUR INCLUDE */
          table th:nth-child(7), table td:nth-child(7) { width: 60px; }  /* PRICE */
          table th:nth-child(8), table td:nth-child(8) { width: 40px; }  /* Fee */
          table th:nth-child(9), table td:nth-child(9) { width: 30px; }  /* Unit */
          table th:nth-child(10), table td:nth-child(10) { width: 60px; } /* TOTAL */
          
          @page {
            size: landscape;
            margin: 10mm;
          }
        </style>
      </head>
      <body onload="window.print(); window.setTimeout(function(){ window.close(); }, 500);">
    `);

    // เพิ่มส่วนหัว Invoice
    printWindow.document.write(`
      <style>
        .invoice-header {
          display: flex; /* ใช้ Flexbox เพื่อแบ่งสัดส่วน */
          justify-content: space-between; /* ให้ช่องว่างระหว่างรูปและข้อความ */
          align-items: center; /* จัดแนวให้อยู่กึ่งกลางในแนวตั้ง */
          width: 100%; /* ใช้ความกว้างเต็ม */
        }
        .invoice-header > div:first-child {
          width: 60%; /* รูปภาพใช้ 60% ของความกว้าง */
        }
        .invoice-header > div:last-child {
          width: 40%; /* ข้อความด้านขวาใช้ 40% ของความกว้าง */
          text-align: right; /* จัดข้อความชิดขวา */
        }
        #bannerImage {
          width: 100%; /* รูปภาพจะปรับให้เต็มความกว้างของ 60% */
          height: auto; /* รักษาสัดส่วน */
        }
      </style>
      <div class="invoice-header">
        <div>
          <img id="bannerImage" src="../../assets/banner-06.png" alt="SevenSmile Tour & Ticket" />
        </div>
        <div class="invoice-header-right">
          <h2 style="font-size: 18px; margin-bottom: 5px;">INVOICE</h2>
          <p>ATTN: ACCOUNTING DEPT.</p>
          <p>DATE: ${invoiceDate}</p>
        </div>
      </div>
    `);

    // เริ่มตาราง
    printWindow.document.write(`
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>NAME</th>
            <th>REF.</th>
            <th>Hotel</th>
            <th>Date in PHUKET</th>
            <th>TOUR INCLUDE</th>
            ${
              showCostProfit
                ? `<th>Cost</th>
               <th>PRICE</th>
               <th>Profit</th>`
                : `<th>PRICE</th>`
            }
            <th>Fee</th>
            <th>Unit</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
    `);

    // สร้างแถวของตาราง
    if (selectedPaymentIds.length > 0) {
      let itemCount = 0;

      selectedPaymentIds.forEach((paymentId) => {
        const payment = allPaymentsData.find((p) => p.id === paymentId);
        if (!payment || !payment.bookings || payment.bookings.length === 0)
          return;

        itemCount++;
        const nameText = `${payment.first_name || ""} ${
          payment.last_name || ""
        } / ${payment.pax || ""} (${payment.agent_name || ""})`.trim();
        const refValue = payment.ref || "-";

        let hotelText = "-";
        for (const booking of payment.bookings) {
          if (booking.tour_hotel) {
            hotelText = booking.tour_hotel;
            break;
          } else if (booking.hotel) {
            hotelText = booking.hotel;
            break;
          }
        }

        const rowSpanCount = payment.bookings.length;
        let paymentRowTotal = 0;
        let paymentCostTotal = 0;
        let paymentProfitTotal = 0;

        const sortedBookings = [...payment.bookings].sort((a, b) => {
          const dateA = a.date || a.tour_date || a.transfer_date || "";
          const dateB = b.date || b.tour_date || b.transfer_date || "";
          if (!dateA) return 1;
          if (!dateB) return -1;
          return new Date(dateA) - new Date(dateB);
        });

        sortedBookings.forEach((booking, index) => {
          const unitVal = booking.quantity || 0;
          const priceVal = booking.sellingPrice || 0;
          const costVal = booking.cost || 0;
          const rowTotal = priceVal * unitVal;
          const rowCostTotal = costVal * unitVal;
          const profitVal = priceVal - costVal;
          const feeVal = booking.fee || 0;

          paymentRowTotal += rowTotal;
          paymentCostTotal += costVal * unitVal;
          paymentProfitTotal += profitVal * unitVal;

          const detailText =
            booking.detail ||
            booking.tour_detail ||
            booking.transfer_detail ||
            "-";
          const bookingDate =
            booking.date || booking.tour_date || booking.transfer_date || "-";
          const formattedDate =
            bookingDate !== "-"
              ? format(new Date(bookingDate), "dd MMM yy").toUpperCase()
              : "-";

          printWindow.document.write("<tr>");

          if (index === 0) {
            printWindow.document.write(`
              <td rowspan="${rowSpanCount}" style="text-align: center;">${itemCount}</td>
              <td rowspan="${rowSpanCount}">${nameText}</td>
              <td rowspan="${rowSpanCount}" style="text-align: center;">${refValue}</td>
              <td rowspan="${rowSpanCount}">${hotelText}</td>
            `);
          }

          printWindow.document.write(`
            <td style="text-align: center;">${formattedDate}</td>
            <td>${detailText}</td>
          `);

          if (showCostProfit) {
            printWindow.document.write(`
              <td style="text-align: right;">${formatNumberWithCommas(
                costVal
              )}</td>
              <td style="text-align: right;">${formatNumberWithCommas(
                priceVal
              )}</td>
              <td style="text-align: right;">${formatNumberWithCommas(
                profitVal
              )}</td>
            `);
          } else {
            printWindow.document.write(`
              <td style="text-align: right;">${formatNumberWithCommas(
                priceVal
              )}</td>
            `);
          }

          printWindow.document.write(`
            <td style="text-align: center;">${formatNumberWithCommas(
              feeVal
            )}</td>
            <td style="text-align: center;">${unitVal}</td>
            <td style="text-align: right;">${formatNumberWithCommas(
              rowTotal
            )}</td>
          `);

          printWindow.document.write("</tr>");
        });

        // Add subtotal row for cost/profit if showing those columns
        if (showCostProfit) {
          printWindow.document.write(`
            <tr class="total-row">
              <td colspan="6" style="text-align: right; font-weight: bold;">Sub-Total (Cost/Price/Profit)</td>
              <td style="text-align: right; font-weight: bold;">${formatNumberWithCommas(
                paymentCostTotal
              )}</td>
              <td style="text-align: right; font-weight: bold;">${formatNumberWithCommas(
                paymentRowTotal
              )}</td>
              <td style="text-align: right; font-weight: bold;">${formatNumberWithCommas(
                paymentProfitTotal
              )}</td>
              <td colspan="3"></td>
            </tr>
          `);
        }

        // Add total row for this payment
        printWindow.document.write(`
          <tr class="total-row">
            <td colspan="${
              showCostProfit ? 10 : 8
            }" style="text-align: right; font-weight: bold;">Total Amount</td>
            <td colspan="2" style="text-align: right; font-weight: bold;">${formatNumberWithCommas(
              paymentRowTotal
            )}</td>
          </tr>
        `);
      });

      // Add grand total row
      if (grandTotal !== undefined && grandTotal !== null) {
        printWindow.document.write(`
          <tr class="grand-total-row">
            <td colspan="${
              showCostProfit ? 10 : 8
            }" style="text-align: right; font-weight: bold;">GRAND TOTAL</td>
            <td colspan="2" style="text-align: right; font-weight: bold;">${formatNumberWithCommas(
              grandTotal
            )}</td>
          </tr>
        `);
      }
    }

    // ปิดตาราง
    printWindow.document.write("</tbody></table>");

    // เพิ่มส่วนท้าย Invoice
    printWindow.document.write(`
      <div class="invoice-footer">
        <div>
          <p style="font-weight: bold; margin-bottom: 5px;">PAYMENT TO SEVENSMILE</p>
          <p>KBank 255-2431-068</p>
          <p>ACCT : SEVENSMILE CO., LTD.</p>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; font-size: 14px;">GRAND TOTAL: ${formatNumberWithCommas(
            grandTotal || 0
          )} THB</p>
        </div>
      </div>
    `);

    // ปิด document
    printWindow.document.write("</body></html>");
    printWindow.document.close();
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("payments").select("*");
      if (error) throw error;
      setAllPaymentsData(data || []);
      organizePaymentsByMonth(data);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // แสดง Payment Select Modal
  const PaymentSelectModal = () => {
    if (!isSelectModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
        <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-bold">
              เลือก Payments ที่ต้องการสร้าง Invoice
            </h5>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsSelectModalOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {Object.keys(paymentsByMonth).length === 0 ? (
              <div className="text-yellow-600 bg-yellow-100 p-3 rounded">
                ไม่พบข้อมูล Payment
              </div>
            ) : (
              <div className="space-y-3">
                {Object.keys(paymentsByMonth)
                  .sort()
                  .map((month) => (
                    <div key={month}>
                      <h5 className="pb-2 border-b text-blue-600 font-medium">
                        {month}
                      </h5>
                      {paymentsByMonth[month].map((payment) => (
                        <label
                          key={payment.id}
                          className="flex items-center mb-2 pl-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="mr-2 rounded"
                            value={payment.id}
                            checked={selectedPaymentIds.includes(payment.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPaymentIds([
                                  ...selectedPaymentIds,
                                  payment.id,
                                ]);
                              } else {
                                setSelectedPaymentIds(
                                  selectedPaymentIds.filter(
                                    (id) => id !== payment.id
                                  )
                                );
                              }
                            }}
                          />
                          <span>
                            {payment.displayName}
                            {payment.dateRangeStr}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => setIsSelectModalOpen(false)}
            >
              ปิด
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleConfirmSelection}
            >
              ยืนยันการเลือก
            </button>
          </div>
        </div>
      </div>
    );
  };

  // แสดง View Invoices Modal
  const ViewInvoicesModal = () => {
    if (!isViewModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-bold">เลือก Invoice</h5>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsViewModalOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto mb-4">
            {invoicesList.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                ไม่พบข้อมูล Invoice
              </div>
            ) : (
              <div className="space-y-2">
                {invoicesList.map((invoice) => (
                  <div
                    key={invoice.id}
                    onClick={() => handleViewSelectedInvoice(invoice.id)}
                    className="p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">
                        {invoice.invoice_name || "ไม่มีชื่อ"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.invoice_date || "ไม่มีวันที่"}
                      </div>
                    </div>
                    <Eye size={18} className="text-blue-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => setIsViewModalOpen(false)}
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-6 print:hidden">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Invoice</h1>
        <p className="text-gray-600 mb-4">รายละเอียด Order / Payment ทั้งหมด</p>
      </div>

      <div className="max-w-7xl mx-auto p-4 rounded-lg shadow-md bg-white print:p-0 print:m-0 print:w-full">
        {/* Payment Selection Modal */}
        <PaymentSelectModal />

        {/* View Invoices Modal */}
        <ViewInvoicesModal />

        {/* Invoice Controls - ซ่อนเมื่อพิมพ์ */}
        <div className="print:hidden text-center mb-4 space-x-2">
          {isViewingExistingInvoice && (
            <div className="text-center mb-4 bg-blue-100 text-blue-700 p-2 rounded">
              กำลังดู Invoice <b>{currentInvoice?.invoice_name || invoiceId}</b>{" "}
              อยู่
            </div>
          )}

          <button
            className="inline-flex items-center px-3 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 mr-2"
            onClick={handleOpenSelectModal}
          >
            <CheckSquare size={16} className="mr-1" />
            เลือก Payments
          </button>

          <button
            className="inline-flex items-center px-3 py-2 rounded bg-green-500 text-white hover:bg-green-600 mr-2"
            onClick={handleSaveInvoice}
            disabled={isViewingExistingInvoice}
          >
            <Save size={16} className="mr-1" />
            บันทึก Invoice
          </button>

          <button
            className="inline-flex items-center px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 mr-2"
            onClick={handleEditInvoice}
          >
            <Edit size={16} className="mr-1" />
            แก้ไข Invoice
          </button>

          <button
            className="inline-flex items-center px-3 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600 mr-2"
            onClick={handleExportCsv}
          >
            <Download size={16} className="mr-1" />
            นำออกข้อมูล
          </button>

          <button
            className="inline-flex items-center px-3 py-2 rounded bg-blue-400 text-white hover:bg-blue-500 mr-2"
            onClick={handleViewInvoices}
          >
            <Eye size={16} className="mr-1" />
            ดูรายการ Invoice
          </button>

          <button
            className="inline-flex items-center px-3 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
            onClick={handlePrint}
          >
            <Printer size={16} className="mr-1" />
            พิมพ์
          </button>

          <div className="text-center mb-4 mt-4">
            <label className="inline-flex items-center space-x-2">
              <input
                className="rounded"
                type="checkbox"
                checked={showCostProfit}
                onChange={handleToggleCostProfit}
              />
              <span>แสดงต้นทุน (Cost) และกำไร (Profit)</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-3 relative rounded print:hidden">
            <strong className="font-bold mr-1">ข้อผิดพลาด:</strong> {error}
            <button
              className="absolute top-2 right-2 text-red-500 hover:text-red-600"
              onClick={() => setError(null)}
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div ref={printRef}>
          {/* Invoice Content - แสดงเสมอ */}
          <HeaderInvoice
            invoiceDate={invoiceDate}
            handleEditInvoiceDate={handleEditInvoiceDate}
          />

          <InvoiceTable
            selectedPaymentIds={selectedPaymentIds}
            allPaymentsData={allPaymentsData}
            showCostProfit={showCostProfit}
            handleEditRef={handleEditRef}
            handleEditFee={handleEditFee}
            grandTotal={grandTotal}
            loading={loading}
            formatNumberWithCommas={formatNumberWithCommas}
          />

          <InvoiceFooter
            grandTotal={grandTotal}
            formatNumberWithCommas={formatNumberWithCommas}
          />
        </div>

        {/* Summary Section - ซ่อนเมื่อพิมพ์ */}
        <SummarySection
          showCostProfit={showCostProfit}
          selectedPaymentIds={selectedPaymentIds}
          totalCost={totalCost}
          totalSellingPrice={totalSellingPrice}
          totalProfit={totalProfit}
          formatNumberWithCommas={formatNumberWithCommas}
        />
      </div>
    </div>
  );
};

export default Invoice;
