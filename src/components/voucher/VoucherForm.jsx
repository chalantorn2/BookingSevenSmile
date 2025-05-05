import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Printer, Download, Check, Camera } from "lucide-react";
import { useInformation } from "../../contexts/InformationContext";
import { useNotification } from "../../hooks/useNotification";
import domtoimage from "dom-to-image";
import html2canvas from "html2canvas";

// Component ช่องกรอกข้อมูล Voucher
const VoucherInput = ({
  name,
  value,
  onChange,
  disabled = false,
  width = "w-4/5",
}) => (
  <input
    type="text"
    name={name}
    value={value || ""}
    onChange={onChange}
    disabled={disabled}
    className={`border-b border-gray-500 focus:outline-none ${width} text-center ${
      disabled ? "bg-gray-100 text-gray-400" : ""
    }`}
  />
);

// Component สำหรับแสดงรายการใน Service Option
const ServiceItem = ({ label, name, value, onChange, disabled }) => {
  return (
    <div className="flex items-start mb-3">
      <span className="min-w-[80px] inline-block text-left">{label}:</span>
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className={`border-b border-gray-500 focus:outline-none w-4/5 text-center ${
          disabled ? "bg-gray-100 text-gray-400" : ""
        }`}
      />
    </div>
  );
};

const VoucherForm = ({
  booking,
  bookingType,
  voucherData: initialVoucherData,
  onSave,
}) => {
  const { showSuccess, showError, showInfo } = useNotification();
  const printRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [voucherData, setVoucherData] = useState({
    customer_name: "",
    contact_person: "",
    accommodation: false,
    accommodation_at: "",
    accommodation_pax: "",
    accommodation_check_in: "",
    accommodation_check_out: "",
    accommodation_room: "",
    accommodation_night: "",
    accommodation_price: "",
    transfer: false,
    transfer_from: "",
    transfer_to: "",
    transfer_by: "",
    transfer_pax: "",
    transfer_date: "",
    transfer_time: "",
    transfer_price: "",
    transfer_pickup_time: "",
    tour: false,
    tour_name: "",
    tour_pax: "",
    tour_by: "",
    tour_date: "",
    tour_price: "",
    tour_pickup_at: "",
    payment_option: "",
    payment_amount: "",
    remark: "",
    issue_by: "",
    year_number: new Date().getFullYear().toString(),
    sequence_number: "0001",
    ...(initialVoucherData || {}), // แก้ไขที่นี่
  });

  useEffect(() => {
    if (booking && initialVoucherData) {
      const customerName = booking.orders
        ? `${booking.orders.first_name || ""} ${
            booking.orders.last_name || ""
          }`.trim()
        : "";

      const initialData = {
        ...voucherData,
        customer_name: customerName,
        ...(initialVoucherData || {}),
      };

      if (bookingType === "tour") {
        initialData.tour = true;
        initialData.tour_name = booking.tour_detail || "";
        initialData.tour_pax = booking.pax || "";
        initialData.tour_date = booking.tour_date
          ? format(new Date(booking.tour_date), "dd/MM/yyyy")
          : "";
        initialData.tour_pickup_at = booking.tour_hotel || "";
      } else if (bookingType === "transfer") {
        initialData.transfer = true;
        initialData.transfer_from = booking.pickup_location || "";
        initialData.transfer_to = booking.drop_location || "";
        initialData.transfer_date = booking.transfer_date
          ? format(new Date(booking.transfer_date), "dd/MM/yyyy")
          : "";
        initialData.transfer_time = booking.transfer_time || "";
        initialData.transfer_pax = booking.pax || "";
      }

      setVoucherData(initialData);
    }
  }, [booking, bookingType, initialVoucherData]);

  // Preload the logo image to ensure it's ready for screenshot
  useEffect(() => {
    const img = new Image();
    img.src = "/src/assets/Tour and Ticket 5.png";
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      console.error("Failed to load logo image");
      setImageLoaded(true); // Proceed even if image fails
    };
  }, []);

  // อัพเดตข้อมูลในฟอร์ม
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setVoucherData({
        ...voucherData,
        [name]: checked,
      });
    } else {
      setVoucherData({
        ...voucherData,
        [name]: value,
      });
    }
  };

  // เลือกตัวเลือกการชำระเงิน - ทำงานแบบ toggle
  const handlePaymentOptionChange = (option) => {
    if (voucherData.payment_option === option) {
      setVoucherData({
        ...voucherData,
        payment_option: "",
      });
    } else {
      setVoucherData({
        ...voucherData,
        payment_option: option,
      });
    }
  };

  // บันทึก voucher
  const handleSaveVoucher = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const saveData = {
        ...voucherData,
        booking_id: booking.id,
        booking_type: bookingType,
      };

      await onSave(saveData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadImage = () => {
    if (!printRef.current || !imageLoaded) {
      showError("กรุณารอโหลดข้อมูลให้ครบก่อนบันทึก");
      return;
    }

    showInfo("กำลังสร้างรูปภาพ กรุณารอสักครู่...");

    domtoimage
      .toBlob(printRef.current, {
        /* options */
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // ปรับการสร้างชื่อไฟล์ ไม่ใช้ voucherNumber ซึ่งอาจไม่มี
        const filename = `voucher_${
          voucherData.year_number || new Date().getFullYear()
        }_${voucherData.sequence_number || "0001"}${
          voucherData.customer_name
            ? `_${voucherData.customer_name.replace(/\s+/g, "_")}`
            : ""
        }.png`;

        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        showSuccess("บันทึกรูปภาพสำเร็จ");
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการสร้างรูปภาพ:", error);
        showError("เกิดข้อผิดพลาดในการสร้างรูปภาพ: " + error.message);
      });
  };

  const captureAndCopyScreenshot = () => {
    if (!printRef.current || !imageLoaded) {
      showError("กรุณารอโหลดข้อมูลให้ครบก่อนแคปภาพ");
      return;
    }

    showInfo("กำลังคัดลอกภาพ กรุณารอสักครู่...");

    setTimeout(() => {
      const captureWidth = printRef.current.scrollWidth;
      const captureHeight = printRef.current.scrollHeight;

      console.log(`Capturing dimensions: ${captureWidth}x${captureHeight}`);

      const options = {
        bgcolor: "#ffffff",
        style: {
          "background-color": "#ffffff",
          overflow: "visible",
          width: `${captureWidth}px`,
          height: `${captureHeight}px`,
        },
        width: captureWidth,
        height: captureHeight,
        quality: 1,
        scale: 2,
      };

      domtoimage
        .toBlob(printRef.current, options)
        .then((blob) => {
          try {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard
              .write([item])
              .then(() => showSuccess("คัดลอกรูปภาพไปยังคลิปบอร์ดแล้ว"))
              .catch((error) => {
                console.error("ไม่สามารถคัดลอกไปยังคลิปบอร์ดได้:", error);
                showError("ไม่สามารถคัดลอกไปยังคลิปบอร์ดได้: " + error.message);

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `voucher_${new Date().getTime()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                showSuccess("บันทึกรูปภาพแทนการคัดลอก");
              });
          } catch (error) {
            console.error("เกิดข้อผิดพลาดในการคัดลอก:", error);
            showError(
              "เบราว์เซอร์ของคุณไม่รองรับการคัดลอกรูปภาพ: " + error.message
            );

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `voucher_${new Date().getTime()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            showSuccess("บันทึกรูปภาพแทนการคัดลอก");
          }
        })
        .catch((error) => {
          console.error("เกิดข้อผิดพลาดในการสร้างภาพ:", error);
          showError("เกิดข้อผิดพลาดในการสร้างภาพ: " + error.message);

          html2canvas(printRef.current, {
            scrollX: 0,
            scrollY: 0,
            width: captureWidth,
            height: captureHeight,
            scale: 2,
            backgroundColor: "#ffffff",
            allowTaint: true,
            useCORS: true,
          })
            .then((canvas) => {
              canvas.toBlob((blob) => {
                try {
                  const item = new ClipboardItem({ "image/png": blob });
                  navigator.clipboard
                    .write([item])
                    .then(() => showSuccess("คัดลอกรูปภาพไปยังคลิปบอร์ดแล้ว"))
                    .catch((err) => {
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `voucher_${new Date().getTime()}.png`;
                      link.click();
                      URL.revokeObjectURL(url);
                      showSuccess("บันทึกรูปภาพแทนการคัดลอก");
                    });
                } catch (e) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `voucher_${new Date().getTime()}.png`;
                  link.click();
                  URL.revokeObjectURL(url);
                  showSuccess("บันทึกรูปภาพแทนการคัดลอก");
                }
              });
            })
            .catch((err) => {
              showError("ไม่สามารถสร้างภาพได้: " + err.message);
            });
        });
    }, 1000); // เพิ่มเวลารอให้มากขึ้นเป็น 1000ms
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-center gap-4 mb-6 print:hidden">
        <button
          className={`px-4 py-2 bg-green-600 text-white rounded-md flex items-center ${
            isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
          }`}
          onClick={handleSaveVoucher}
          disabled={isSaving}
        >
          <Check size={18} className="mr-2" />
          {isSaving ? "กำลังบันทึก..." : "บันทึก Voucher"}
        </button>

        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
          onClick={captureAndCopyScreenshot}
        >
          <Camera size={18} className="mr-2" />
          แคปภาพ
        </button>
      </div>

      <div
        ref={printRef}
        className="border border-gray-300 rounded-lg p-6 bg-white mx-auto"
        style={{
          pageBreakInside: "avoid",
          breakInside: "avoid",
          minHeight: "100%",
          overflow: "visible",
          width: "100%",
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <img
              src="/src/assets/Tour and Ticket 5.png"
              alt="SevenSmile Logo"
              className="h-16 mr-4"
            />
            <div>
              <h2 className="text-xl font-bold">
                หจก.พิกรพร ธุรกิจ / เซเว่นสไมล์ ทัวร์ แอนด์ ทิคเก็ต
              </h2>
              <p className="text-sm">
                33 ถ.มหาราช ซอย 8 ต.ปากน้ำ อ.เมือง จ.กระบี่ 8100
              </p>
              <p className="text-sm">095 265 5516, 083 969 1300</p>
              <p className="text-sm">TAT License No. 31/00878</p>
            </div>
          </div>
          <div className="flex flex-col justify-start">
            <div className="bg-blue-600 text-white p-2 text-center mb-2">
              <span className="block font-bold">
                เลขที่: {voucherData.year_number || new Date().getFullYear()}
              </span>
            </div>
            <div className="bg-blue-600 text-white p-2 text-center">
              <span className="block font-bold">
                เลขที่: {voucherData.sequence_number || "0001"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between mb-6">
          <div className="mb-4 sm:mb-0 flex-1">
            <span className="font-bold">Customer's name:</span>
            <input
              type="text"
              name="customer_name"
              value={voucherData.customer_name}
              onChange={handleInputChange}
              className="border-b border-gray-500 focus:outline-none ml-2 w-4/5 text-center"
            />
          </div>
          <div className="flex-1">
            <span className="font-bold">Contact person:</span>
            <input
              type="text"
              name="contact_person"
              value={voucherData.contact_person}
              onChange={handleInputChange}
              className="border-b border-gray-500 focus:outline-none ml-2 w-4/5 text-center"
            />
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">Sevice Order for Tour</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-300 p-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="accommodation"
                name="accommodation"
                checked={voucherData.accommodation}
                onChange={handleInputChange}
                className="mr-2 h-5 w-5"
              />
              <label htmlFor="accommodation" className="text-lg font-bold">
                Accommodation
              </label>
            </div>

            <div className="space-y-3">
              <ServiceItem
                label="At"
                name="accommodation_at"
                value={voucherData.accommodation_at}
                onChange={handleInputChange}
                disabled={!voucherData.accommodation}
              />

              <ServiceItem
                label="Pax"
                name="accommodation_pax"
                value={voucherData.accommodation_pax}
                onChange={handleInputChange}
                disabled={!voucherData.accommodation}
              />

              <ServiceItem
                label="Check in"
                name="accommodation_check_in"
                value={voucherData.accommodation_check_in}
                onChange={handleInputChange}
                disabled={!voucherData.accommodation}
              />

              <ServiceItem
                label="Check out"
                name="accommodation_check_out"
                value={voucherData.accommodation_check_out}
                onChange={handleInputChange}
                disabled={!voucherData.accommodation}
              />

              <ServiceItem
                label="Room"
                name="accommodation_room"
                value={voucherData.accommodation_room}
                onChange={handleInputChange}
                disabled={!voucherData.accommodation}
              />

              <ServiceItem
                label="Night"
                name="accommodation_night"
                value={voucherData.accommodation_night}
                onChange={handleInputChange}
                disabled={!voucherData.accommodation}
              />

              <ServiceItem
                label="Price"
                name="accommodation_price"
                value={voucherData.accommodation_price}
                onChange={handleInputChange}
                disabled={!voucherData.accommodation}
              />
            </div>
          </div>

          <div className="border border-gray-300 p-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="transfer"
                name="transfer"
                checked={voucherData.transfer}
                onChange={handleInputChange}
                className="mr-2 h-5 w-5"
              />
              <label htmlFor="transfer" className="text-lg font-bold">
                Transfer
              </label>
            </div>

            <div className="space-y-3">
              <ServiceItem
                label="From"
                name="transfer_from"
                value={voucherData.transfer_from}
                onChange={handleInputChange}
                disabled={!voucherData.transfer}
              />

              <ServiceItem
                label="To"
                name="transfer_to"
                value={voucherData.transfer_to}
                onChange={handleInputChange}
                disabled={!voucherData.transfer}
              />

              <ServiceItem
                label="By"
                name="transfer_by"
                value={voucherData.transfer_by}
                onChange={handleInputChange}
                disabled={!voucherData.transfer}
              />

              <ServiceItem
                label="Pax"
                name="transfer_pax"
                value={voucherData.transfer_pax}
                onChange={handleInputChange}
                disabled={!voucherData.transfer}
              />

              <ServiceItem
                label="Date"
                name="transfer_date"
                value={voucherData.transfer_date}
                onChange={handleInputChange}
                disabled={!voucherData.transfer}
              />

              <ServiceItem
                label="Time"
                name="transfer_time"
                value={voucherData.transfer_time}
                onChange={handleInputChange}
                disabled={!voucherData.transfer}
              />

              <ServiceItem
                label="Price"
                name="transfer_price"
                value={voucherData.transfer_price}
                onChange={handleInputChange}
                disabled={!voucherData.transfer}
              />
            </div>
          </div>

          <div className="border border-gray-300 p-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="tour"
                name="tour"
                checked={voucherData.tour}
                onChange={handleInputChange}
                className="mr-2 h-5 w-5"
              />
              <label htmlFor="tour" className="text-lg font-bold">
                Tour
              </label>
            </div>

            <div className="space-y-3">
              <ServiceItem
                label="Tour"
                name="tour_name"
                value={voucherData.tour_name}
                onChange={handleInputChange}
                disabled={!voucherData.tour}
              />

              <ServiceItem
                label="Pax"
                name="tour_pax"
                value={voucherData.tour_pax}
                onChange={handleInputChange}
                disabled={!voucherData.tour}
              />

              <ServiceItem
                label="By"
                name="tour_by"
                value={voucherData.tour_by}
                onChange={handleInputChange}
                disabled={!voucherData.tour}
              />

              <ServiceItem
                label="Date"
                name="tour_date"
                value={voucherData.tour_date}
                onChange={handleInputChange}
                disabled={!voucherData.tour}
              />

              <ServiceItem
                label="Price"
                name="tour_price"
                value={voucherData.tour_price}
                onChange={handleInputChange}
                disabled={!voucherData.tour}
              />

              <ServiceItem
                label="Pick up at"
                name="tour_pickup_at"
                value={voucherData.tour_pickup_at}
                onChange={handleInputChange}
                disabled={!voucherData.tour}
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-10 gap-4">
            <div className="items-start col-span-4">
              <div className="flex">
                <input
                  type="checkbox"
                  id="no_payment"
                  name="payment_option"
                  checked={voucherData.payment_option === "no_payment"}
                  onChange={() => handlePaymentOptionChange("no_payment")}
                  className="mr-2 h-5 w-5 mt-1"
                />
                <label htmlFor="no_payment" className="text-base">
                  ไม่ต้องเก็บเงินใดๆ จากผู้เดินทางอีก <br />
                  The clients do not have to pay any more
                </label>
              </div>
            </div>

            <div className="items-start col-span-6">
              <div className="flex flex-col">
                <div className="flex">
                  <input
                    type="checkbox"
                    id="pay_at_office"
                    name="payment_option"
                    checked={voucherData.payment_option === "pay_at_office"}
                    onChange={() => handlePaymentOptionChange("pay_at_office")}
                    className="mr-2 h-5 w-5 mt-1"
                  />
                  <label htmlFor="pay_at_office" className="text-base">
                    ผู้เดินทางต้องชำระเงิน ก่อนเข้ารับบริการอีกเป็นจำนวนเงิน{" "}
                    <br />
                    The clients are to pay at the referred office. the unpaid
                    amount of
                  </label>
                </div>

                {voucherData.payment_option === "pay_at_office" && (
                  <div className="mt-2 ml-7">
                    <input
                      type="text"
                      name="payment_amount"
                      value={voucherData.payment_amount}
                      onChange={handleInputChange}
                      className="border-b border-gray-500 focus:outline-none w-full text-center"
                      placeholder="ระบุจำนวนเงิน / Enter amount"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex mb-2">
            <span className="font-bold">Remark:</span>
            <input
              type="text"
              name="remark"
              value={voucherData.remark}
              onChange={handleInputChange}
              className="border-b border-gray-500 focus:outline-none ml-2 flex-1 text-center"
            />
          </div>
        </div>

        <div className="flex justify-between mt-12">
          <div className="text-center">
            <div className="border-t border-gray-500 w-48 mx-auto mt-12"></div>
            <p className="font-medium mt-2">Customer's signature</p>
          </div>

          <div className="text-center">
            <input
              type="text"
              name="issue_by"
              value={voucherData.issue_by}
              onChange={handleInputChange}
              className="border-b border-gray-500 focus:outline-none w-48 mx-auto text-center"
            />
            <div className="border-t border-gray-500 w-48 mx-auto"></div>
            <p className="font-medium mt-2">Issue by</p>
          </div>
        </div>

        <div className="text-center mt-6 text-sm">
          <p>
            *** This voucher-ticket is non refundable and can use on the
            specific date and the time only. ***
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoucherForm;
