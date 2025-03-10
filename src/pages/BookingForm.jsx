import React, { useState, useEffect } from "react";
import supabase from "../config/supabaseClient";
import OrderSelector from "../components/forms/OrderSelector";
import TourForm from "../components/forms/TourForm";
import TransferForm from "../components/forms/TransferForm";
import BookingCounter from "../components/ui/BookingCounter";
import { generateOrderID, generateBookingID } from "../utils/idGenerator";

const BookingForm = () => {
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentOrderKey, setCurrentOrderKey] = useState(null);
  const [isBookingSectionVisible, setIsBookingSectionVisible] = useState(false);
  const [tourForms, setTourForms] = useState([]);
  const [transferForms, setTransferForms] = useState([]);
  const [mainFormData, setMainFormData] = useState({
    agent: "",
    firstName: "",
    lastName: "",
    pax: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ฟังก์ชันสำหรับเลือก Order
  const handleOrderSelect = (orderKey, orderId) => {
    if (orderKey) {
      setCurrentOrderKey(orderKey);
      setCurrentOrderId(orderId);
      setIsBookingSectionVisible(true);
      // โหลดข้อมูล Order
      loadOrderDetails(orderKey);
    } else {
      resetForm();
      setIsBookingSectionVisible(false);
    }
  };

  // ฟังก์ชันสำหรับสร้าง Order ใหม่
  const handleCreateNewOrder = () => {
    resetForm();
    setCurrentOrderKey(null);
    setCurrentOrderId(null);
    setIsBookingSectionVisible(true);
  };

  // ฟังก์ชันสำหรับโหลดรายละเอียด Order
  const loadOrderDetails = async (orderKey) => {
    try {
      setIsLoading(true);

      // ดึงข้อมูล order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderKey)
        .single();

      if (orderError) throw orderError;

      // ดึงข้อมูล tour bookings
      const { data: tourData, error: tourError } = await supabase
        .from("tour_bookings")
        .select("*")
        .eq("order_id", orderKey);

      if (tourError) throw tourError;

      // ดึงข้อมูล transfer bookings
      const { data: transferData, error: transferError } = await supabase
        .from("transfer_bookings")
        .select("*")
        .eq("order_id", orderKey);

      if (transferError) throw transferError;

      // ตั้งค่าข้อมูลฟอร์มหลักจาก order
      setMainFormData({
        agent: orderData.agent_name || "",
        firstName: orderData.first_name || "",
        lastName: orderData.last_name || "",
        pax:
          tourData.length > 0
            ? tourData[0].pax
            : transferData.length > 0
            ? transferData[0].pax
            : "",
      });

      // สร้าง tour forms
      const newTourForms = tourData.map((tour, index) => ({
        id: index + 1,
        data: tour,
      }));

      // สร้าง transfer forms
      const newTransferForms = transferData.map((transfer, index) => ({
        id: index + 1,
        data: transfer,
      }));

      setTourForms(newTourForms);
      setTransferForms(newTransferForms);
    } catch (error) {
      console.error("Error loading order details:", error);
      setErrorMessage("ไม่สามารถโหลดข้อมูล Order ได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับล้างฟอร์ม
  const resetForm = () => {
    setMainFormData({
      agent: "",
      firstName: "",
      lastName: "",
      pax: "",
    });
    setTourForms([]);
    setTransferForms([]);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ฟังก์ชันสำหรับเพิ่มฟอร์มทัวร์
  const handleAddTourForm = () => {
    const nextId =
      tourForms.length > 0
        ? Math.max(...tourForms.map((form) => form.id)) + 1
        : 1;

    setTourForms([...tourForms, { id: nextId }]);
  };

  // ฟังก์ชันสำหรับเพิ่มฟอร์มรถรับส่ง
  const handleAddTransferForm = () => {
    const nextId =
      transferForms.length > 0
        ? Math.max(...transferForms.map((form) => form.id)) + 1
        : 1;

    setTransferForms([...transferForms, { id: nextId }]);
  };

  // ฟังก์ชันสำหรับลบฟอร์มทัวร์
  const handleRemoveTourForm = (id) => {
    setTourForms(tourForms.filter((form) => form.id !== id));
  };

  // ฟังก์ชันสำหรับลบฟอร์มรถรับส่ง
  const handleRemoveTransferForm = (id) => {
    setTransferForms(transferForms.filter((form) => form.id !== id));
  };

  // ฟังก์ชันสำหรับการเปลี่ยนแปลงในฟอร์มหลัก
  const handleMainFormChange = (e) => {
    const { name, value } = e.target;
    setMainFormData({
      ...mainFormData,
      [name]: value,
    });
  };

  // ฟังก์ชันสำหรับส่งฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!mainFormData.agent) {
        throw new Error(
          "กรุณากรอก Agent ก่อน เพื่อใช้เป็น prefix ของ Order ID"
        );
      }

      if (tourForms.length === 0 && transferForms.length === 0) {
        throw new Error(
          "กรุณาเพิ่มการจอง Tour หรือ Transfer อย่างน้อย 1 รายการ"
        );
      }

      // ถ้าไม่มี currentOrderKey ให้สร้าง Order ใหม่
      let referenceId = currentOrderId;
      let orderKey = currentOrderKey;

      if (!orderKey) {
        // สร้าง Order Reference ID (เลขอ้างอิง)
        referenceId = await generateOrderID(mainFormData.agent);

        // สร้าง Order ใหม่
        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            first_name: mainFormData.firstName,
            last_name: mainFormData.lastName,
            agent_name: mainFormData.agent,
            reference_id: referenceId, // เก็บเลขอ้างอิงในคอลัมน์ reference_id
          })
          .select()
          .single();

        if (orderError) throw orderError;

        orderKey = newOrder.id; // id จะเป็นตัวเลขที่ถูกสร้างโดยอัตโนมัติ
        setCurrentOrderKey(orderKey);
        setCurrentOrderId(referenceId);
      }

      // รวบรวมวันที่ทั้งหมดเพื่อหาวันเริ่มต้นและวันสิ้นสุด
      let allDates = [];

      // บันทึกการจองทัวร์
      const tourBookingIds = [];
      const formElements = document.forms[0].elements;

      for (const tourForm of tourForms) {
        const formId = tourForm.id;

        // สร้าง Booking ID
        const bookingId = await generateBookingID("tour");

        // ดึงข้อมูลจากฟอร์ม
        const tourDate = formElements[`tour_${formId}_date`].value;
        if (tourDate) allDates.push(tourDate);

        // สร้างข้อมูลการจองทัวร์
        const tourData = {
          order_id: orderKey, // เชื่อมโยงกับ id ของตาราง orders
          tour_date: tourDate,
          tour_detail: formElements[`tour_${formId}_detail`].value,
          pax: parseInt(mainFormData.pax) || 0,
          cost_price: formElements[`tour_${formId}_cost_price`].value || null,
          selling_price:
            formElements[`tour_${formId}_selling_price`].value || null,
          status: "pending", // เปลี่ยนจาก 'รอดำเนินการ' เป็น 'pending'
          note: formElements[`tour_${formId}_note`].value,
        };

        // บันทึกลงฐานข้อมูล
        const { error: tourError } = await supabase
          .from("tour_bookings")
          .insert(tourData);

        if (tourError) throw tourError;

        tourBookingIds.push(bookingId);
      }

      // บันทึกการจองรถรับส่ง
      const transferBookingIds = [];

      for (const transferForm of transferForms) {
        const formId = transferForm.id;

        // สร้าง Booking ID
        const bookingId = await generateBookingID("transfer");

        // ดึงข้อมูลจากฟอร์ม
        const transferDate = formElements[`transfer_${formId}_date`].value;
        if (transferDate) allDates.push(transferDate);

        // สร้างข้อมูลการจองรถรับส่ง
        const transferData = {
          order_id: orderKey, // เชื่อมโยงกับ id ของตาราง orders
          transfer_date: transferDate,
          transfer_time: formElements[`transfer_${formId}_pickup_time`].value,
          pickup_location:
            formElements[`transfer_${formId}_pickup_location`].value,
          drop_location: formElements[`transfer_${formId}_drop_location`].value,
          driver_name: formElements[`transfer_${formId}_driver_name`].value,
          license_plate: formElements[`transfer_${formId}_license_plate`].value,
          pax: parseInt(mainFormData.pax) || 0,
          cost_price:
            formElements[`transfer_${formId}_cost_price`].value || null,
          selling_price:
            formElements[`transfer_${formId}_selling_price`].value || null,
          transfer_detail: formElements[`transfer_${formId}_detail`].value,
          status: "pending", // เปลี่ยนจาก 'รอดำเนินการ' เป็น 'pending'
          note: formElements[`transfer_${formId}_note`].value,
        };

        // บันทึกลงฐานข้อมูล
        const { error: transferError } = await supabase
          .from("transfer_bookings")
          .insert(transferData);

        if (transferError) throw transferError;

        transferBookingIds.push(bookingId);
      }

      // อัปเดตวันที่เริ่มต้นและสิ้นสุดใน Order
      if (allDates.length > 0) {
        allDates.sort();
        const startDate = allDates[0];
        const endDate = allDates[allDates.length - 1];

        const { error: updateError } = await supabase
          .from("orders")
          .update({ start_date: startDate, end_date: endDate })
          .eq("id", orderKey);

        if (updateError) throw updateError;
      }

      // แสดงข้อความสำเร็จ
      let message = "บันทึกข้อมูลสำเร็จ!\n";
      if (tourBookingIds.length > 0) {
        message += `Tour Bookings: ${tourBookingIds.length}\n`;
      }
      if (transferBookingIds.length > 0) {
        message += `Transfer Bookings: ${transferBookingIds.length}\n`;
      }

      setSuccessMessage(message);
      resetForm();
      setIsBookingSectionVisible(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Seven Smile Booking</h1>
        <p className="text-gray-600 mb-6">กรุณาเลือกฟอร์มที่ต้องการกรอก</p>

        <div className="flex justify-center gap-4 mb-8">
          <a
            href="/view-bookings"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
          >
            ดูรายการจอง
          </a>
          <a
            href="/view-orders"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
          >
            ดูรายการ Order
          </a>
        </div>
      </div>

      {/* Order Selector */}
      <OrderSelector
        onOrderSelect={handleOrderSelect}
        onCreateNewOrder={handleCreateNewOrder}
      />

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Booking Form Section */}
      {isBookingSectionVisible && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gray-800 text-white p-4 text-center">
            <h2 className="text-xl font-semibold">ข้อมูลหลักของ Booking</h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="agent"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Agent
                  </label>
                  <input
                    type="text"
                    id="agent"
                    name="agent"
                    value={mainFormData.agent}
                    onChange={handleMainFormChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    placeholder="ชื่อ Agent"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={mainFormData.firstName}
                    onChange={handleMainFormChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    placeholder="ชื่อลูกค้า"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={mainFormData.lastName}
                    onChange={handleMainFormChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    placeholder="นามสกุลลูกค้า"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="pax"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Pax
                  </label>
                  <input
                    type="number"
                    id="pax"
                    name="pax"
                    value={mainFormData.pax}
                    onChange={handleMainFormChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    placeholder="จำนวนคน"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-center space-x-4 mb-6">
                <button
                  type="button"
                  onClick={handleAddTourForm}
                  className="px-4 py-2 border border-green-500 text-green-500 rounded-md hover:bg-green-500 hover:text-white transition"
                >
                  Add Tour
                </button>

                <button
                  type="button"
                  onClick={handleAddTransferForm}
                  className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition"
                >
                  Add Transfer
                </button>
              </div>

              {(tourForms.length > 0 || transferForms.length > 0) && (
                <>
                  <BookingCounter
                    tourCount={tourForms.length}
                    transferCount={transferForms.length}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      {tourForms.map((form) => (
                        <TourForm
                          key={form.id}
                          id={form.id}
                          onRemove={handleRemoveTourForm}
                        />
                      ))}
                    </div>

                    <div>
                      {transferForms.map((form) => (
                        <TransferForm
                          key={form.id}
                          id={form.id}
                          onRemove={handleRemoveTransferForm}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition disabled:opacity-50"
                    >
                      {isLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
