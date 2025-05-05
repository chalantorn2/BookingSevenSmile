import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ServiceItem, VoucherInput } from "./VoucherForm";
import { Check, Camera } from "lucide-react";
import { useNotification } from "../../hooks/useNotification";
import domtoimage from "dom-to-image";

const TourVoucherForm = ({
  booking,
  voucherData: initialVoucherData,
  onSave,
}) => {
  const { showSuccess, showError, showInfo } = useNotification();
  const printRef = React.useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [voucherData, setVoucherData] = useState({
    customer_name: "",
    contact_person: "",
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
    customer_signature: "", // เพิ่มฟิลด์ใหม่
    year_number: new Date().getFullYear().toString(),
    sequence_number: "0001",
    ...(initialVoucherData || {}),
  });

  useEffect(() => {
    if (booking && initialVoucherData) {
      const customerName = booking.orders
        ? `${booking.orders.first_name || ""} ${
            booking.orders.last_name || ""
          }`.trim()
        : "";
      setVoucherData((prev) => ({
        ...prev,
        customer_name: customerName,
        tour_name: booking.tour_type || "",
        tour_pax: booking.pax || "",
        tour_date: booking.tour_date
          ? format(new Date(booking.tour_date), "dd/MM/yyyy")
          : "",
        tour_pickup_at: booking.tour_hotel || "",
        ...(initialVoucherData || {}),
      }));
    }
  }, [booking, initialVoucherData]);

  useEffect(() => {
    const img = new Image();
    img.src = "../../assets/Tour and Ticket 5.png";
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      console.error("Failed to load logo image");
      setImageLoaded(true);
    };

    const fontLink = document.createElement("link");
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
    setFontLoaded(true);

    return () => {
      document.head.removeChild(fontLink);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVoucherData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentOptionChange = (option) => {
    setVoucherData((prev) => ({
      ...prev,
      payment_option: prev.payment_option === option ? "" : option,
    }));
  };

  const handleSaveVoucher = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave({
        ...voucherData,
        booking_id: booking.id,
        booking_type: "tour",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadImage = () => {
    if (!printRef.current || !imageLoaded || !fontLoaded) {
      showError("กรุณารอโหลดข้อมูลและฟอนต์ให้ครบก่อนบันทึก");
      return;
    }

    showInfo("กำลังสร้างรูปภาพ กรุณารอสักครู่...");

    domtoimage
      .toBlob(printRef.current, {
        style: { fontFamily: "Kanit, sans-serif" },
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `voucher_${voucherData.year_number}_${
          voucherData.sequence_number
        }${
          voucherData.customer_name
            ? `_${voucherData.customer_name.replace(/\s+/g, "_")}`
            : ""
        }.png`;
        link.click();
        window.URL.revokeObjectURL(url);
        showSuccess("บันทึกรูปภาพสำเร็จ");
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการสร้างรูปภาพ:", error);
        showError("เกิดข้อผิดพลาดในการสร้างรูปภาพ: " + error.message);
      });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 font-kanit">
      <div className="flex justify-center gap-4 mb-6 print:hidden">
        <button
          className={`px-4 py-2 bg-green-600 text-white rounded-md flex items-center ${
            isSaving ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
          } font-kanit`}
          onClick={handleSaveVoucher}
          disabled={isSaving}
        >
          <Check size={18} className="mr-2" />
          {isSaving ? "กำลังบันทึก..." : "บันทึก Voucher"}
        </button>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center font-kanit"
          onClick={handleDownloadImage}
        >
          <Camera size={18} className="mr-2" />
          แคปภาพ
        </button>
      </div>

      <div
        ref={printRef}
        className="border border-gray-300 rounded-lg p-6 bg-white mx-auto font-kanit"
        style={{
          pageBreakInside: "avoid",
          breakInside: "avoid",
          minHeight: "100%",
          overflow: "visible",
          width: "100%",
          fontFamily: "Kanit, sans-serif",
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <img
              src="../../assets/Tour and Ticket 5.png"
              alt="SevenSmile Logo"
              className="h-16 mr-4"
              onError={(e) => (e.target.src = "/fallback-logo.png")}
            />
            <div>
              <h2 className="text-xl font-bold font-kanit">
                หจก.พิกรพร ธุรกิจ / เซเว่นสไมล์ ทัวร์ แอนด์ ทิคเก็ต
              </h2>
              <p className="text-sm font-kanit">
                33 ถ.มหาราช ซอย 8 ต.ปากน้ำ อ.เมือง จ.กระบี่ 8100
              </p>
              <p className="text-sm font-kanit">095 265 5516, 083 969 1300</p>
              <p className="text-sm font-kanit">TAT License No. 31/00878</p>
            </div>
          </div>
          <div className="flex flex-col justify-start">
            <div className="bg-blue-600 text-white p-2 text-center mb-2">
              <span className="block font-bold font-kanit">
                เลขที่: {voucherData.year_number || new Date().getFullYear()}
              </span>
            </div>
            <div className="bg-blue-600 text-white p-2 text-center">
              <span className="block font-bold font-kanit">
                เลขที่: {voucherData.sequence_number || "0001"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between mb-6">
          <div className="mb-4 sm:mb-0 flex-1">
            <span className="font-bold font-kanit">Customer's name:</span>
            <VoucherInput
              name="customer_name"
              value={voucherData.customer_name}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex-1">
            <span className="font-bold font-kanit">Contact person:</span>
            <VoucherInput
              name="contact_person"
              value={voucherData.contact_person}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold font-kanit">
            Service Order for Tour
          </h2>
        </div>

        <div className="border border-gray-300 p-4 mb-6">
          <h3 className="text-lg font-bold font-kanit mb-4">Tour</h3>
          <div className="space-y-3">
            <ServiceItem
              label="Tour"
              name="tour_name"
              value={voucherData.tour_name}
              onChange={handleInputChange}
            />
            <ServiceItem
              label="Pax"
              name="tour_pax"
              value={voucherData.tour_pax}
              onChange={handleInputChange}
            />
            <ServiceItem
              label="By"
              name="tour_by"
              value={voucherData.tour_by}
              onChange={handleInputChange}
            />
            <ServiceItem
              label="Date"
              name="tour_date"
              value={voucherData.tour_date}
              onChange={handleInputChange}
            />
            <ServiceItem
              label="Price"
              name="tour_price"
              value={voucherData.tour_price}
              onChange={handleInputChange}
            />
            <ServiceItem
              label="Pick up at"
              name="tour_pickup_at"
              value={voucherData.tour_pickup_at}
              onChange={handleInputChange}
            />
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
                <label htmlFor="no_payment" className="text-base font-kanit">
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
                  <label
                    htmlFor="pay_at_office"
                    className="text-base font-kanit"
                  >
                    ผู้เดินทางต้องชำระเงิน ก่อนเข้ารับบริการอีกเป็นจำนวนเงิน{" "}
                    <br />
                    The clients are to pay at the referred office. the unpaid
                    amount of
                  </label>
                </div>
                {voucherData.payment_option === "pay_at_office" && (
                  <div className="mt-2 ml-7">
                    <VoucherInput
                      name="payment_amount"
                      value={voucherData.payment_amount}
                      onChange={handleInputChange}
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
            <span className="font-bold font-kanit">Remark:</span>
            <VoucherInput
              name="remark"
              value={voucherData.remark}
              onChange={handleInputChange}
              width="flex-1"
            />
          </div>
        </div>

        <div className="flex justify-between mt-12 px-32">
          <div className="text-center">
            <VoucherInput
              name="customer_signature"
              value={voucherData.customer_signature}
              onChange={handleInputChange}
              width="w-48"
            />
            <div className="border-t border-gray-500 w-48 mx-auto"></div>
            <p className="font-medium mt-2 font-kanit">Customer's signature</p>
          </div>
          <div className="text-center">
            <VoucherInput
              name="issue_by"
              value={voucherData.issue_by}
              onChange={handleInputChange}
              width="w-48"
            />
            <div className="border-t border-gray-500 w-48 mx-auto"></div>
            <p className="font-medium mt-2 font-kanit">Issue by</p>
          </div>
        </div>

        <div className="text-center mt-6 text-sm">
          <p className="font-kanit">
            *** This voucher-ticket is non refundable and can use on the
            specific date and the time only. ***
          </p>
        </div>
      </div>
    </div>
  );
};

export default TourVoucherForm;
