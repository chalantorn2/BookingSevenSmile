import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Search,
  Calendar,
  Save,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  FileText,
  Printer,
  Download,
  CheckSquare,
  PlusCircle,
  X,
} from "lucide-react";
import supabase from "../config/supabaseClient";
import { formatDate } from "../utils/dateUtils";
import {
  fetchAllInvoices,
  createInvoice,
  updateInvoice,
  updatePaymentsInvoiceStatus,
  fetchInvoiceById,
} from "../services/invoiceService";
import "../styles/invoice.css"; // ตรวจสอบว่าพาธถูกต้อง
// Helper function to format numbers with commas
const formatNumberWithCommas = (num) => {
  if (num === null || num === undefined) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const Invoice = () => {
  // State variables
  const [allPaymentsData, setAllPaymentsData] = useState({});
  const [allTourBookings, setAllTourBookings] = useState([]);
  const [allTransferBookings, setAllTransferBookings] = useState([]);

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [invoicesList, setInvoicesList] = useState([]);

  const [paymentsByMonth, setPaymentsByMonth] = useState({});
  const [currentEditingInvoice, setCurrentEditingInvoice] = useState(null);

  const [grandTotal, setGrandTotal] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalSellingPrice, setTotalSellingPrice] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  const [currentInvoice, setCurrentInvoice] = useState(null);

  const [isViewingExistingInvoice, setIsViewingExistingInvoice] =
    useState(false);

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
      if (payment.invoiced) return; // Skip already invoiced payments

      // Get date from the first booking (if available)
      let paymentDate = new Date();
      if (payment.bookings && payment.bookings.length > 0) {
        const firstBooking = payment.bookings[0];
        const dateStr =
          firstBooking.date ||
          firstBooking.tour_date ||
          firstBooking.transfer_date;
        if (dateStr) {
          paymentDate = new Date(dateStr);
        }
      }

      const monthKey = `${
        months[paymentDate.getMonth()]
      } ${paymentDate.getFullYear()}`;

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = [];
      }

      // Extract date range from bookings
      let startDate = null;
      let endDate = null;

      if (payment.bookings && payment.bookings.length > 0) {
        payment.bookings.forEach((booking) => {
          const price = parseFloat(booking.sellingPrice) || 0;
          const quantity = parseInt(booking.quantity) || 0;
          const cost = parseFloat(booking.cost) || 0;

          const rowTotal = price * quantity;
          const rowCost = cost * quantity;
          const rowProfit = rowTotal - rowCost; // คำนวณกำไรเป็นผลต่างระหว่างยอดขายกับต้นทุน

          grandTotalSum += rowTotal;
          costSum += rowCost;
          sellingSum += rowTotal;
          profitSum += rowProfit;
        });
      }

      // Format date range
      let dateRangeStr = "";
      if (startDate && endDate) {
        const formatDateShort = (date) => {
          return format(date, "dd/MM/yyyy");
        };

        if (startDate.getTime() === endDate.getTime()) {
          dateRangeStr = ` / ${formatDateShort(startDate)}`;
        } else {
          dateRangeStr = ` / ${formatDateShort(startDate)} - ${formatDateShort(
            endDate
          )}`;
        }
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

  // Open payment selection modal
  const handleOpenSelectModal = () => {
    setIsSelectModalOpen(true);
  };

  // Handle payment selection confirmation
  const handleConfirmSelection = () => {
    setIsSelectModalOpen(false);
    buildInvoiceTable();
  };

  // Build the invoice table with selected payments
  // แก้ไขฟังก์ชัน buildInvoiceTable
  const buildInvoiceTable = () => {
    if (selectedPaymentIds.length === 0) {
      return;
    }

    setLoading(true);

    try {
      // ใช้ฟังก์ชัน calculateTotals ที่มีอยู่แล้วเพื่อคำนวณยอดรวม
      calculateTotals();
    } catch (error) {
      console.error("Error building invoice table:", error);
      setError("เกิดข้อผิดพลาดในการสร้างตาราง Invoice");
    } finally {
      setLoading(false);
    }
  };

  // แก้ไขฟังก์ชัน handleSaveInvoice
  // แก้ไขฟังก์ชัน handleSaveInvoice ใน Invoice.jsx
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
      // จำกัดขนาดของตัวเลขเพื่อป้องกัน overflow
      // แปลงเป็น Number และจำกัดทศนิยม 2 ตำแหน่ง
      const safeGrandTotal = Number(Number(grandTotal).toFixed(2));
      const safeTotalCost = Number(Number(totalCost).toFixed(2));
      const safeTotalSellingPrice = Number(
        Number(totalSellingPrice).toFixed(2)
      );
      const safeTotalProfit = Number(Number(totalProfit).toFixed(2));

      // ตรวจสอบว่าตัวเลขไม่เกินขีดจำกัดของ PostgreSQL numeric
      // PostgreSQL มีขีดจำกัดประมาณ 10^38
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
        total_amount: safeGrandTotal.toString(), // เก็บเป็น string
        total_cost: safeTotalCost.toString(), // เก็บเป็น string
        total_selling_price: safeTotalSellingPrice.toString(), // เก็บเป็น string
        total_profit: safeTotalProfit.toString(), // เก็บเป็น string
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log("Saving invoice data:", invoiceData);

      // ส่งข้อมูลไปบันทึก
      const { data, error } = await supabase
        .from("invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;

      // อัปเดตสถานะ payment เป็น invoiced = true
      for (const paymentId of selectedPaymentIds) {
        const { error: updateError } = await supabase
          .from("payments")
          .update({ invoiced: true })
          .eq("id", paymentId);

        if (updateError) {
          console.error(`Failed to update payment ${paymentId}:`, updateError);
        }
      }

      alert(`บันทึก Invoice เรียบร้อย! Invoice: ${invoiceName}`);

      // รีเซ็ตหน้าจอ
      setSelectedPaymentIds([]);
      setGrandTotal(0);
      setTotalCost(0);
      setTotalSellingPrice(0);
      setTotalProfit(0);

      // โหลดข้อมูลใหม่
      await loadInitialData();
    } catch (error) {
      console.error("Error saving invoice:", error);
      setError(`เกิดข้อผิดพลาดในการบันทึก Invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    // เริ่มต้นที่ 0
    let grandTotalSum = 0;
    let costSum = 0;
    let sellingSum = 0;
    let profitSum = 0;

    // คำนวณสำหรับทุก payment ที่เลือก
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

  // Load and view existing invoices
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

  // Handle selecting an invoice to view
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
      if (data) {
        setCurrentInvoice(data);
      }

      // Set data for viewing/editing
      setInvoiceId(selectedInvoiceId);
      setInvoiceDate(data.invoice_date || format(new Date(), "dd/MM/yyyy"));
      setSelectedPaymentIds(data.payment_ids || []);

      // ตั้งค่ายอดรวมจากข้อมูลที่มีอยู่แล้ว
      setGrandTotal(parseFloat(data.total_amount) || 0);
      setTotalCost(parseFloat(data.total_cost) || 0);
      setTotalSellingPrice(parseFloat(data.total_selling_price) || 0);
      setTotalProfit(parseFloat(data.total_profit) || 0);

      // Close modal and build invoice table
      setIsViewModalOpen(false);
      // buildInvoiceTable(); => เราไม่ต้องเรียกฟังก์ชันนี้ซ้ำอีก เพราะเราได้ตั้งค่ายอดรวมแล้ว
    } catch (error) {
      console.error("Error loading invoice:", error);
      setError("ไม่สามารถโหลดข้อมูล Invoice ได้");
    } finally {
      setLoading(false);
    }
    setIsViewingExistingInvoice(true);
  };

  // Open edit invoice modal
  const handleEditInvoice = () => {
    if (!invoiceId) {
      setError("กรุณาเลือก Invoice ที่จะแก้ไขก่อน");
      return;
    }

    setCurrentEditingInvoice({
      id: invoiceId,
      payment_ids: [...selectedPaymentIds],
    });

    setIsEditModalOpen(true);
  };

  // Save edited invoice
  const handleSaveEditInvoice = async () => {
    if (!currentEditingInvoice || !currentEditingInvoice.id) {
      setError("ไม่พบข้อมูล Invoice ที่แก้ไข");
      return;
    }

    setLoading(true);
    try {
      // Get original invoice to compare
      const { data: originalInvoice } = await fetchInvoiceById(
        currentEditingInvoice.id
      );
      if (!originalInvoice) {
        throw new Error("ไม่พบข้อมูล Invoice เดิม");
      }

      const oldPaymentIds = originalInvoice.payment_ids || [];
      const newPaymentIds = currentEditingInvoice.payment_ids;

      // Find payments that were removed
      const removedPaymentIds = oldPaymentIds.filter(
        (id) => !newPaymentIds.includes(id)
      );

      // Find payments that were added
      const addedPaymentIds = newPaymentIds.filter(
        (id) => !oldPaymentIds.includes(id)
      );

      // Update removed payments to not invoiced
      if (removedPaymentIds.length > 0) {
        await updatePaymentsInvoiceStatus(removedPaymentIds, false);
      }

      // Update added payments to invoiced
      if (addedPaymentIds.length > 0) {
        await updatePaymentsInvoiceStatus(addedPaymentIds, true);
      }

      // Update invoice with new payment_ids
      await updateInvoice(currentEditingInvoice.id, {
        payment_ids: newPaymentIds,
        updated_at: new Date().toISOString(),
      });

      alert("บันทึกการแก้ไข Invoice เรียบร้อย");

      // Refresh data and close modal
      setIsEditModalOpen(false);
      setCurrentEditingInvoice(null);
      setInvoiceId(currentEditingInvoice.id);
      setSelectedPaymentIds(newPaymentIds);
      buildInvoiceTable();
    } catch (error) {
      console.error("Error saving invoice changes:", error);
      setError("เกิดข้อผิดพลาดในการบันทึกการแก้ไข Invoice");
    } finally {
      setLoading(false);
    }
  };

  // Handle printing the invoice
  const handlePrint = () => {
    // ไม่ต้องทำการเปลี่ยนสไตล์ให้มาก เพราะเรามี CSS ที่จัดการแล้ว
    const table = document.getElementById("invoiceTable");
    if (table) {
      if (showCostProfit) {
        table.classList.add("show-cost-profit");
      } else {
        table.classList.remove("show-cost-profit");
      }
    }

    // เพิ่ม delay เล็กน้อยเพื่อให้ CSS ทำงาน
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Export table to CSV
  const handleExportCsv = () => {
    try {
      const table = document.getElementById("invoiceTable");
      if (!table) {
        setError("ไม่พบตาราง Invoice");
        return;
      }

      let csv = [];

      // Get all rows
      for (let i = 0; i < table.rows.length; i++) {
        let row = [];
        // Get each cell in this row
        for (let j = 0; j < table.rows[i].cells.length; j++) {
          let text = table.rows[i].cells[j].innerText.replace(
            /(\r\n|\n|\r)/gm,
            " "
          );
          text = text.replace(/"/g, '""'); // Escape double quotes
          row.push(`"${text}"`);
        }
        csv.push(row.join(","));
      }

      const csvString = csv.join("\n");

      // Add UTF-8 BOM to ensure proper encoding for Thai characters
      const BOM = "\uFEFF";
      const finalCSV = BOM + csvString;

      // Create a download link and trigger it
      const blob = new Blob([finalCSV], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", "invoice_export.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("นำออกข้อมูลเป็น CSV สำเร็จ");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      setError("เกิดข้อผิดพลาดในการนำออกข้อมูลเป็น CSV");
    }
  };

  // Toggle showing cost and profit columns
  const handleToggleCostProfit = () => {
    setShowCostProfit(!showCostProfit);
    buildInvoiceTable();
  };

  // Edit reference number for a payment
  const handleEditRef = async (paymentId, currentRef) => {
    const newRefValue = prompt("กรุณากรอกเลข REF ใหม่:", currentRef || "");
    if (newRefValue === null) return; // User canceled

    try {
      setLoading(true);

      // Update reference in database
      const { error } = await supabase
        .from("payments")
        .update({ ref: newRefValue })
        .eq("id", paymentId);

      if (error) throw error;

      alert("อัปเดต REF เรียบร้อย");
      buildInvoiceTable();
    } catch (error) {
      console.error("Error updating REF:", error);
      setError("ไม่สามารถอัปเดต REF ได้");
    } finally {
      setLoading(false);
    }
  };

  // Edit fee for a booking
  const handleEditFee = async (paymentId, bookingIndex, currentFee) => {
    const newFeeValue = prompt("กรุณากรอก Fee ใหม่:", currentFee || "0");
    if (newFeeValue === null) return; // User canceled

    try {
      setLoading(true);

      // Find the payment
      const payment = allPaymentsData.find((p) => p.id === paymentId);
      if (!payment || !payment.bookings || !payment.bookings[bookingIndex]) {
        throw new Error("ไม่พบข้อมูล Booking");
      }

      // Create a deep copy of bookings
      const bookingsCopy = JSON.parse(JSON.stringify(payment.bookings));
      // Update fee value
      bookingsCopy[bookingIndex].fee = parseFloat(newFeeValue) || 0;

      // Update in database
      const { error } = await supabase
        .from("payments")
        .update({ bookings: bookingsCopy })
        .eq("id", paymentId);

      if (error) throw error;

      alert("อัปเดต Fee เรียบร้อย");
      await loadInitialData();
      buildInvoiceTable();
    } catch (error) {
      console.error("Error updating fee:", error);
      setError("ไม่สามารถอัปเดต Fee ได้");
    } finally {
      setLoading(false);
    }
  };

  // Edit invoice date
  const handleEditInvoiceDate = () => {
    const newDate = prompt("กรุณากรอกวันที่ Invoice:", invoiceDate);
    if (!newDate) return;

    setInvoiceDate(newDate);

    // If this is an existing invoice, update it in the database
    if (invoiceId) {
      updateInvoice(invoiceId, { invoice_date: newDate })
        .then(({ success }) => {
          if (success) {
            alert("อัปเดตวันที่ Invoice เรียบร้อย");
          }
        })
        .catch((error) => {
          console.error("Error updating invoice date:", error);
          setError("ไม่สามารถอัปเดตวันที่ Invoice ได้");
        });
    }
  };

  // Render payment selection by month
  const renderPaymentsByMonth = () => {
    const months = Object.keys(paymentsByMonth).sort();

    if (months.length === 0) {
      return (
        <div className="text-yellow-600 bg-yellow-100 p-3 rounded">
          ไม่พบข้อมูล Payment
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {months.map((month) => (
          <div key={month}>
            <h5 className="pb-2 border-b text-blue-600 font-medium">{month}</h5>
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
                        selectedPaymentIds.filter((id) => id !== payment.id)
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
    );
  };

  // Render invoice table
  const renderInvoiceTable = () => {
    if (selectedPaymentIds.length === 0) {
      return (
        <tr>
          <td
            colSpan={showCostProfit ? 12 : 10}
            className="text-center text-red-500 py-4"
          >
            ไม่มีรายการที่เลือก
          </td>
        </tr>
      );
    }

    const tableRows = [];
    let itemCount = 0;

    // For each selected payment
    selectedPaymentIds.forEach((paymentId) => {
      const payment = allPaymentsData.find((p) => p.id === paymentId);
      if (!payment || !payment.bookings || payment.bookings.length === 0)
        return;

      itemCount++;

      // Get customer name and agent
      const nameText = `${payment.first_name || ""} ${
        payment.last_name || ""
      } / ${payment.pax || ""}`.trim();
      const refValue = payment.ref || "-";

      // Find hotel from bookings
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
      // Subtotals for this payment
      let paymentRowTotal = 0;
      let paymentCostTotal = 0;
      let paymentProfitTotal = 0;

      // Sort bookings by date
      const sortedBookings = [...payment.bookings].sort((a, b) => {
        const dateA = a.date || a.tour_date || a.transfer_date || "";
        const dateB = b.date || b.tour_date || b.transfer_date || "";
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA) - new Date(dateB);
      });

      // Add rows for each booking
      sortedBookings.forEach((booking, index) => {
        const unitVal = booking.quantity || 0;
        const priceVal = booking.sellingPrice || 0;
        const costVal = booking.cost || 0;
        const rowTotal = priceVal * unitVal;
        const rowCostTotal = costVal * unitVal;
        // ในไฟล์ Invoice.jsx ในฟังก์ชัน renderInvoiceTable
        // แก้การคำนวณ profitVal จากเดิม
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

        const tr = (
          <tr
            key={`${paymentId}-${index}`}
            className="border-b last:border-b-0"
          >
            {index === 0 && (
              <>
                <td rowSpan={rowSpanCount} className="px-2 py-2 border-r">
                  {itemCount}
                </td>
                <td rowSpan={rowSpanCount} className="px-2 py-2 border-r">
                  {nameText}
                </td>
                <td
                  rowSpan={rowSpanCount}
                  className="px-2 py-2 border-r cursor-pointer "
                  onClick={() => handleEditRef(paymentId, refValue)}
                >
                  {refValue}
                </td>
                <td rowSpan={rowSpanCount} className="px-2 py-2 border-r">
                  {hotelText}
                </td>
              </>
            )}
            <td className="px-2 py-2 border-r">{formattedDate}</td>
            <td className="px-2 py-2 border-r text-left">{detailText}</td>
            {showCostProfit ? (
              <>
                <td className="px-2 py-2 border-r text-right">
                  {formatNumberWithCommas(costVal)}
                </td>
                <td className="px-2 py-2 border-r text-right">
                  {formatNumberWithCommas(priceVal)}
                </td>
                <td className="px-2 py-2 border-r text-right">
                  {formatNumberWithCommas(profitVal)}
                </td>
              </>
            ) : (
              <td className="px-2 py-2 border-r text-right">
                {formatNumberWithCommas(priceVal)}
              </td>
            )}
            <td
              className="px-2 py-2 border-r text-center cursor-pointer "
              onClick={() => handleEditFee(paymentId, index, feeVal)}
            >
              {formatNumberWithCommas(feeVal)}
            </td>
            <td className="px-2 py-2 border-r text-center">{unitVal}</td>
            <td className="px-2 py-2 text-right">
              {formatNumberWithCommas(rowTotal)}
            </td>
          </tr>
        );
        tableRows.push(tr);
      });

      // เพิ่ม Subtotal row
      if (showCostProfit) {
        const subtotalRow = (
          <tr
            key={`${paymentId}-subtotal`}
            className="border-b bg-gray-50 total-row"
          >
            <td
              colSpan={6}
              className="px-2 py-2 text-right font-bold text-gray-600"
            >
              Sub-Total (Cost/Price/Profit)
            </td>
            <td className="px-2 py-2 font-bold text-blue-500 text-right">
              {formatNumberWithCommas(paymentCostTotal)}
            </td>
            <td className="px-2 py-2 font-bold text-blue-700 text-right">
              {formatNumberWithCommas(paymentRowTotal)}
            </td>
            <td className="px-2 py-2 font-bold text-green-600 text-right">
              {formatNumberWithCommas(paymentProfitTotal)}
            </td>
            <td colSpan={3}></td>
          </tr>
        );
        tableRows.push(subtotalRow);
      }

      // เพิ่ม Total row สำหรับ payment นี้
      const totalRow = (
        <tr
          key={`${paymentId}-total`}
          className="border-b bg-gray-100 total-row"
        >
          <td
            colSpan={showCostProfit ? 10 : 8}
            className="px-2 py-2 text-right font-bold"
          >
            Total Amount
          </td>
          <td colSpan={2} className="px-2 py-2 font-bold text-right">
            {formatNumberWithCommas(paymentRowTotal)}
          </td>
        </tr>
      );

      tableRows.push(totalRow);
    });

    // เพิ่ม Grand Total row ด้านล่างสุด
    const grandRow = (
      <tr key="grand-total" className="bg-green-50 grand-total-row">
        <td
          colSpan={showCostProfit ? 10 : 8}
          className="px-2 py-2 text-right font-bold text-green-700"
        >
          GRAND TOTAL
        </td>
        <td
          colSpan={2}
          className="px-2 py-2 font-bold text-green-700 text-right"
        >
          {formatNumberWithCommas(grandTotal)}
        </td>
      </tr>
    );
    if (grandTotal !== undefined && grandTotal !== null) {
      const grandRow = (
        <tr key="grand-total" className="bg-green-50 grand-total-row">
          <td
            colSpan={showCostProfit ? 10 : 8}
            className="px-2 py-2 text-right font-bold text-green-700"
          >
            GRAND TOTAL
          </td>
          <td
            colSpan={2}
            className="px-2 py-2 font-bold text-green-700 text-right"
          >
            {formatNumberWithCommas(grandTotal)}
          </td>
        </tr>
      );
      tableRows.push(grandRow);
    }

    return tableRows;
  };

  // Render payment selection modal
  const renderSelectModal = () => {
    return (
      <div
        className={`${
          isSelectModalOpen
            ? "fixed inset-0 z-50 flex items-center justify-center"
            : "hidden"
        }`}
      >
        {/* Backdrop */}
        {isSelectModalOpen && (
          <div
            className="absolute inset-0 modal-backdrop"
            onClick={() => setIsSelectModalOpen(false)}
          />
        )}
        {/* Modal Content */}
        <div
          className="relative bg-white rounded shadow-lg max-w-4xl w-full p-4"
          onClick={(e) => e.stopPropagation()}
        >
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
            {renderPaymentsByMonth()}
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

  // Render view invoices modal
  // Replace the existing renderViewModal function in Invoice.jsx with this updated version:
  const renderViewModal = () => {
    const [searchInvoiceQuery, setSearchInvoiceQuery] = useState("");
    const filteredInvoiceList = searchInvoiceQuery
      ? invoicesList.filter(
          (invoice) =>
            (invoice.invoice_name || "")
              .toLowerCase()
              .includes(searchInvoiceQuery.toLowerCase()) ||
            (invoice.invoice_date || "").includes(searchInvoiceQuery)
        )
      : invoicesList.slice(0, 3); // แสดงเพียง 3 รายการล่าสุด

    return (
      <div
        className={`${
          isViewModalOpen
            ? "fixed inset-0 z-50 flex items-center justify-center"
            : "hidden"
        }`}
      >
        {/* Backdrop */}
        {isViewModalOpen && (
          <div
            className="absolute inset-0 modal-backdrop bg-black"
            onClick={() => setIsViewModalOpen(false)}
          />
        )}
        {/* Modal Content */}
        <div
          className="relative bg-white rounded shadow-lg max-w-md w-full p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-bold">เลือก Invoice</h5>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsViewModalOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded"
                placeholder="ค้นหาตามชื่อหรือวันที่..."
                value={searchInvoiceQuery}
                onChange={(e) => setSearchInvoiceQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto mb-4">
            {filteredInvoiceList.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                ไม่พบ Invoice ที่ตรงกับคำค้นหา
              </div>
            ) : (
              <div className="space-y-2">
                {filteredInvoiceList.map((invoice) => (
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

  // Render edit invoice modal
  const renderEditModal = () => {
    if (!currentEditingInvoice) return null;

    return (
      <div
        className={`${
          isEditModalOpen
            ? "fixed inset-0 z-50 flex items-center justify-center"
            : "hidden"
        }`}
      >
        {/* Backdrop */}
        {isEditModalOpen && (
          <div
            className="absolute inset-0 modal-backdrop"
            onClick={() => setIsEditModalOpen(false)}
          />
        )}
        {/* Modal Content */}
        <div
          className="relative bg-white rounded shadow-lg max-w-5xl w-full p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-bold">แก้ไข Invoice</h5>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditModalOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="mb-4">
            <h6 className="font-semibold mb-2">รายการ Payment ที่เลือก</h6>
            <ul className="border border-gray-200 rounded divide-y divide-gray-200">
              {currentEditingInvoice.payment_ids.map((paymentId, index) => {
                const payment = allPaymentsData.find((p) => p.id === paymentId);
                const displayName = payment
                  ? `${payment.first_name || ""} ${
                      payment.last_name || ""
                    }`.trim()
                  : `Payment #${paymentId}`;

                return (
                  <li
                    key={paymentId}
                    className="p-2 flex items-center justify-between"
                  >
                    <div>
                      <span className="mr-2">{displayName}</span>
                      <button
                        className="text-sm text-red-500 hover:underline"
                        onClick={() => {
                          const newPaymentIds = [
                            ...currentEditingInvoice.payment_ids,
                          ];
                          newPaymentIds.splice(index, 1);
                          setCurrentEditingInvoice({
                            ...currentEditingInvoice,
                            payment_ids: newPaymentIds,
                          });
                        }}
                      >
                        ลบออก
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className={`text-sm bg-gray-300 px-2 py-1 rounded hover:bg-gray-400 ${
                          index === 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={() => {
                          if (index === 0) return;
                          const newPaymentIds = [
                            ...currentEditingInvoice.payment_ids,
                          ];
                          const temp = newPaymentIds[index];
                          newPaymentIds[index] = newPaymentIds[index - 1];
                          newPaymentIds[index - 1] = temp;
                          setCurrentEditingInvoice({
                            ...currentEditingInvoice,
                            payment_ids: newPaymentIds,
                          });
                        }}
                      >
                        ขึ้น
                      </button>
                      <button
                        className={`text-sm bg-gray-300 px-2 py-1 rounded hover:bg-gray-400 ${
                          index === currentEditingInvoice.payment_ids.length - 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => {
                          if (
                            index ===
                            currentEditingInvoice.payment_ids.length - 1
                          )
                            return;
                          const newPaymentIds = [
                            ...currentEditingInvoice.payment_ids,
                          ];
                          const temp = newPaymentIds[index];
                          newPaymentIds[index] = newPaymentIds[index + 1];
                          newPaymentIds[index + 1] = temp;
                          setCurrentEditingInvoice({
                            ...currentEditingInvoice,
                            payment_ids: newPaymentIds,
                          });
                        }}
                      >
                        ลง
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <button
              className="inline-flex items-center space-x-1 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              onClick={() => {
                // Show payments that aren't already in the invoice
                const availablePayments = allPaymentsData.filter(
                  (p) =>
                    !p.invoiced ||
                    currentEditingInvoice.payment_ids.includes(p.id)
                );

                if (availablePayments.length === 0) {
                  alert("ไม่มี Payment ที่สามารถเพิ่มได้");
                  return;
                }
                // Show modal to select additional payments (future feature)
                alert("ฟังก์ชันนี้จะมีการพัฒนาในอนาคต");
              }}
            >
              <PlusCircle size={16} />
              <span>เพิ่ม Payment</span>
            </button>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => setIsEditModalOpen(false)}
            >
              ยกเลิก
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleSaveEditInvoice}
            >
              บันทึกการแก้ไข
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadInitialData();
  }, []);
  useEffect(() => {
    // ลบการสร้าง style element ออก และใช้จาก invoice.css อย่างเดียว
    const handleBeforePrint = () => {
      // เพิ่ม class ให้ตารางเพื่อให้ CSS รองรับการแสดงคอลัมน์ต้นทุนและกำไร
      const table = document.getElementById("invoiceTable");
      if (table) {
        if (showCostProfit) {
          table.classList.add("show-cost-profit");
        } else {
          table.classList.remove("show-cost-profit");
        }
      }
    };

    const handleAfterPrint = () => {
      // คืนค่าการแสดงผลหลังพิมพ์ (ถ้าจำเป็น)
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [showCostProfit]);

  // Load payments and bookings data
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [paymentsSnap, tourSnap, transferSnap] = await Promise.all([
        supabase.from("payments").select("*"),
        supabase.from("tour_bookings").select("*"),
        supabase.from("transfer_bookings").select("*"),
      ]);

      if (paymentsSnap.error) throw paymentsSnap.error;
      if (tourSnap.error) throw tourSnap.error;
      if (transferSnap.error) throw transferSnap.error;

      setAllPaymentsData(paymentsSnap.data || []);
      setAllTourBookings(tourSnap.data || []);
      setAllTransferBookings(transferSnap.data || []);

      organizePaymentsByMonth(paymentsSnap.data);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Invoice</h1>
        <p className="text-gray-600 mb-4">รายละเอียด Order / Payment ทั้งหมด</p>
      </div>
      <div className="max-w-7xl mx-auto p-4 bg-white print:max-w-full print:w-full print:p-0 print:m-0">
        {/* Modals backdrop (Tailwind) */}
        {renderSelectModal()}
        {renderViewModal()}
        {renderEditModal()}

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
            disabled={isViewingExistingInvoice} // เพิ่ม disabled attribute
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
        </div>

        <div className="print:hidden text-center mb-4">
          <label className="inline-flex items-center space-x-2">
            <input
              className="rounded"
              type="checkbox"
              id="showCostProfitCheckbox"
              checked={showCostProfit}
              onChange={handleToggleCostProfit}
            />
            <span>แสดงต้นทุน (Cost) และกำไร (Profit)</span>
          </label>
        </div>

        {/* เนื้อหาส่วน Invoice ที่จะแสดงเมื่อพิมพ์ */}
        <div className="print:block">
          {/* ส่วนหัว Invoice */}
          <div className="grid grid-cols-3 print:flex print:justify-between mb-3">
            <div className="col-span-2">
              <img
                id="bannerImage"
                src="/src/assets/banner-06.png"
                alt="Banner"
                style={{ maxWidth: "80%" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML =
                    '<div class="p-4 text-xl font-bold">SevenSmile Tour & Ticket</div>';
                }}
              />
            </div>
            <div className="invoice-header-right col-span-1 text-right">
              <h2 className="font-bold text-xl mb-1">INVOICE</h2>
              <div className="mb-1">ATTN : ACCOUNTING DEPT.</div>
              <div>
                DATE:{" "}
                <span
                  id="invoiceDateSpan"
                  className="font-semibold italic text-gray-700 border border-gray-300 rounded px-2 cursor-pointer"
                  onClick={handleEditInvoiceDate}
                >
                  {invoiceDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-3 relative rounded">
            <strong className="font-bold mr-1">ข้อผิดพลาด:</strong> {error}
            <button
              className="absolute top-2 right-2 text-red-500 hover:text-red-600"
              onClick={() => setError(null)}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Invoice table */}
        <div className="overflow-x-auto">
          <table
            className="min-w-full border border-gray-300 text-center align-middle"
            id="invoiceTable"
          >
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-2 border-b border-r">Item</th>
                <th className="py-2 px-2 border-b border-r">NAME</th>
                <th className="py-2 px-2 border-b border-r">REF.</th>
                <th className="py-2 px-2 border-b border-r">Hotel</th>
                <th className="py-2 px-2 border-b border-r">Date in PHUKET</th>
                <th className="py-2 px-2 border-b border-r ">TOUR INCLUDE</th>
                {showCostProfit ? (
                  <>
                    <th className="py-2 px-2 border-b border-r">Cost</th>
                    <th className="py-2 px-2 border-b border-r">PRICE</th>
                    <th className="py-2 px-2 border-b border-r">Profit</th>
                  </>
                ) : (
                  <th className="py-2 px-2 border-b border-r">PRICE</th>
                )}
                <th className="py-2 px-2 border-b border-r">Fee</th>
                <th className="py-2 px-2 border-b border-r">Unit</th>
                <th className="py-2 px-2 border-b">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={showCostProfit ? 12 : 10}
                    className="py-4 text-center"
                  >
                    <div className="inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="mt-2 text-sm text-gray-700">
                      กำลังโหลดข้อมูล...
                    </p>
                  </td>
                </tr>
              ) : (
                renderInvoiceTable()
              )}
            </tbody>
          </table>
        </div>

        {/* Footer information */}
        <div className="invoice-footer flex flex-wrap mt-4">
          <div className="w-full md:w-1/2 text-left">
            <p className="mb-1 font-bold">PAYMENT TO SEVENSMILE</p>
            <p className="mb-1">KBank 0000-000-0000</p>
            <p className="mb-1">ACCT : SEVENSMILE CO., LTD.</p>
          </div>
          <div className="w-full md:w-1/2 text-right">
            <div
              className="mt-1 text-lg font-bold text-gray-700"
              id="grandTotalDisplay"
            >
              GRAND TOTAL: {formatNumberWithCommas(grandTotal || 0)} THB
            </div>
          </div>
        </div>

        {/* Summary section for cost/profit */}
        {showCostProfit && selectedPaymentIds.length > 0 && (
          <div className="print:hidden mt-6">
            <div className="flex flex-wrap text-center">
              <div className="w-full md:w-1/3 mb-4">
                <p>
                  <strong>รวมต้นทุนทั้งหมด:</strong>
                  <br />
                  <span className="text-2xl font-bold text-blue-500">
                    {formatNumberWithCommas(totalCost)}
                  </span>
                </p>
              </div>
              <div className="w-full md:w-1/3 mb-4">
                <p>
                  <strong>รวมราคาขายทั้งหมด:</strong>
                  <br />
                  <span className="text-2xl font-bold text-blue-700">
                    {formatNumberWithCommas(totalSellingPrice)}
                  </span>
                </p>
              </div>
              <div className="w-full md:w-1/3 mb-4">
                <p>
                  <strong>กำไรรวมทั้งหมด:</strong>
                  <br />
                  <span className="text-2xl font-bold text-green-600">
                    {formatNumberWithCommas(totalProfit)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoice;
