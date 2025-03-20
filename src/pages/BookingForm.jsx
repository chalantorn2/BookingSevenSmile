import React, { useState, useEffect, useRef, useCallback } from "react";
import supabase from "../config/supabaseClient";
import OrderSelector from "../components/forms/OrderSelector";
import TourForm from "../components/forms/TourForm";
import TransferForm from "../components/forms/TransferForm";
import BookingCounter from "../components/ui/BookingCounter";
import { generateOrderID, generateBookingID } from "../utils/idGenerator";
import { fetchInformationByCategory } from "../services/informationService";
import AutocompleteInput from "../components/common/AutocompleteInput";
import { useInformation } from "../contexts/InformationContext";

const BookingForm = () => {
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentOrderKey, setCurrentOrderKey] = useState(null);
  const [isBookingSectionVisible, setIsBookingSectionVisible] = useState(false);
  const [tourForms, setTourForms] = useState([]);
  const [transferForms, setTransferForms] = useState([]);
  const { agents, addNewInformation, refreshInformation } = useInformation();

  const [mainFormData, setMainFormData] = useState({
    agent: "",
    firstName: "",
    lastName: "",
    pax: "",
  });

  const [status, setStatus] = useState({
    loading: false,
    message: "",
    error: "",
  });
  const [bookingCounts, setBookingCounts] = useState(null);
  const orderSelectorRef = useRef(null);
  const handleOrderSelect = (orderKey, orderId, counts, orderData) => {
    if (orderKey) {
      setCurrentOrderKey(orderKey);
      setCurrentOrderId(orderId);
      setBookingCounts(counts);
      setIsBookingSectionVisible(true);

      // ถ้ามีข้อมูล orderData ที่ส่งมาจาก OrderSelector
      if (orderData) {
        setMainFormData({
          agent: orderData.agent_name || "",
          firstName: orderData.first_name || "",
          lastName: orderData.last_name || "",
          pax: orderData.pax || "", // ตั้งค่า pax จาก orderData
        });
      } else {
        // ถ้าไม่มีให้ดึงข้อมูลพื้นฐานของ Order
        loadOrderBasicDetails(orderKey);
      }
    } else {
      resetForm();
      setIsBookingSectionVisible(false);
      setBookingCounts(null);
    }
  };

  // ใช้ useRef เพื่อเก็บค่า mainFormData ล่าสุดโดยไม่ต้อง re-render
  const formDataRef = useRef(mainFormData);

  // อัปเดต ref เมื่อ mainFormData เปลี่ยน
  useEffect(() => {
    formDataRef.current = mainFormData;
  }, [mainFormData]);

  // ฟังก์ชันสำหรับการเปลี่ยนค่า Agent (แยกออกมาจาก handleMainFormChange)
  const handleAgentChange = useCallback((value) => {
    setMainFormData((prev) => ({
      ...prev,
      agent: value,
    }));
  }, []);

  const handleCreateNewOrder = () => {
    resetForm();
    setCurrentOrderKey(null);
    setCurrentOrderId(null);
    setIsBookingSectionVisible(true);
  };

  // เพิ่ม agent โดยไม่ทำให้หน้าโหลดใหม่
  const handleAddNewAgent = async (value) => {
    try {
      const { data, error } = await supabase
        .from("information")
        .insert({
          category: "agent",
          value: value.trim(),
          description: "",
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error adding new agent:", error);
      return null;
    }
  };

  const processOrderData = (orderData) => {
    setMainFormData({
      agent: orderData.agent_name || "",
      firstName: orderData.first_name || "",
      lastName: orderData.last_name || "",
      pax: "",
    });

    // จัดการข้อมูล Tour Bookings
    if (orderData.tour_bookings && orderData.tour_bookings.length > 0) {
      const formattedTours = orderData.tour_bookings.map((tour, index) => ({
        id: index + 1,
        data: tour,
      }));
      setTourForms(formattedTours);

      // ตั้งค่า pax จาก tour แรกถ้ามี
      if (formattedTours[0].data.pax) {
        setMainFormData((prev) => ({
          ...prev,
          pax: formattedTours[0].data.pax,
        }));
      }
    } else {
      setTourForms([]);
    }

    // จัดการข้อมูล Transfer Bookings
    if (orderData.transfer_bookings && orderData.transfer_bookings.length > 0) {
      const formattedTransfers = orderData.transfer_bookings.map(
        (transfer, index) => ({
          id: index + 1,
          data: transfer,
        })
      );
      setTransferForms(formattedTransfers);

      // ตั้งค่า pax จาก transfer แรกถ้ายังไม่มีค่า pax จาก tour
      if (!mainFormData.pax && formattedTransfers[0].data.pax) {
        setMainFormData((prev) => ({
          ...prev,
          pax: formattedTransfers[0].data.pax,
        }));
      }
    } else {
      setTransferForms([]);
    }
  };

  const loadOrderBasicDetails = async (orderKey) => {
    try {
      setStatus({ ...status, loading: true, error: "" });

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderKey)
        .single();

      if (error) throw error;

      // ตั้งค่าข้อมูลพื้นฐาน
      setMainFormData({
        agent: data.agent_name || "",
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        pax: data.pax || "", // ตรวจสอบว่ามีการดึงค่า pax มาจาก order
      });

      setTourForms([]);
      setTransferForms([]);
    } catch (error) {
      console.error("Error loading order details:", error);
      setStatus({ ...status, error: "ไม่สามารถโหลดข้อมูล Order ได้" });
    } finally {
      setStatus({ ...status, loading: false });
    }
  };
  const resetForm = () => {
    setMainFormData({ agent: "", firstName: "", lastName: "", pax: "" });
    setTourForms([]);
    setTransferForms([]);
    setStatus({ loading: false, message: "", error: "" });
  };

  const handleAddTourForm = () => {
    const nextId =
      tourForms.length > 0
        ? Math.max(...tourForms.map((form) => form.id)) + 1
        : 1;
    setTourForms([...tourForms, { id: nextId }]);
  };

  const handleAddTransferForm = () => {
    const nextId =
      transferForms.length > 0
        ? Math.max(...transferForms.map((form) => form.id)) + 1
        : 1;
    setTransferForms([...transferForms, { id: nextId }]);
  };

  const handleRemoveTourForm = useCallback((id) => {
    setTourForms((prev) => prev.filter((form) => form.id !== id));
  }, []);

  const handleRemoveTransferForm = useCallback((id) => {
    setTransferForms((prev) => prev.filter((form) => form.id !== id));
  }, []);

  const tourFormsRef = useRef(tourForms);
  const transferFormsRef = useRef(transferForms);

  // update refs เมื่อ state เปลี่ยน
  useEffect(() => {
    tourFormsRef.current = tourForms;
  }, [tourForms]);

  useEffect(() => {
    transferFormsRef.current = transferForms;
  }, [transferForms]);

  const handleMainFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setMainFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // แก้ไขส่วนที่มีปัญหาใน handleSubmit ที่เกี่ยวกับการตรวจสอบและส่งข้อมูล

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: "", error: "" });

    try {
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

      let referenceId = currentOrderId;
      let orderKey = currentOrderKey;

      // Create new order if needed
      if (!orderKey) {
        referenceId = await generateOrderID(mainFormData.agent);
        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            first_name: mainFormData.firstName,
            last_name: mainFormData.lastName,
            agent_name: mainFormData.agent,
            reference_id: referenceId,
            pax: parseInt(mainFormData.pax) || 0,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        orderKey = newOrder.id;
        setCurrentOrderKey(orderKey);
        setCurrentOrderId(referenceId);
      }

      // ดึงวันที่จาก Booking เดิมในฐานข้อมูล
      const { data: existingTours, error: tourError } = await supabase
        .from("tour_bookings")
        .select("tour_date")
        .eq("order_id", orderKey);
      if (tourError) throw tourError;

      const { data: existingTransfers, error: transferError } = await supabase
        .from("transfer_bookings")
        .select("transfer_date")
        .eq("order_id", orderKey);
      if (transferError) throw transferError;

      // รวมวันที่ทั้งหมด (เดิม + ใหม่)
      const allDates = [
        ...(existingTours?.map((t) => t.tour_date) || []),
        ...(existingTransfers?.map((t) => t.transfer_date) || []),
      ];

      const formElements = document.forms[0].elements;

      // ในฟังก์ชัน handleSubmit ของ BookingForm.jsx
      // บรรทัดที่มีปัญหาน่าจะอยู่ประมาณนี้

      // สำหรับ tour bookings
      // สำหรับ tour bookings
      const tourBookings = [];
      for (const tourForm of tourForms) {
        const formId = tourForm.id;
        const bookingId = await generateBookingID("tour");
        const tourDateElement = formElements[`tour_${formId}_date`];
        const tourDate = tourDateElement ? tourDateElement.value : "";
        if (tourDate) allDates.push(tourDate);

        // สร้าง object ด้วยข้อมูลพื้นฐานก่อน
        const tourBooking = {
          order_id: orderKey,
          tour_date: tourDate,
          reference_id: bookingId, // เพิ่ม reference_id
        };

        // ส่วนที่เหลือคงเดิม...

        // แล้วค่อยเพิ่มข้อมูลอื่นๆ ที่อาจไม่มี โดยใช้ Optional Chaining
        const detailElement = formElements[`tour_${formId}_detail`];
        if (detailElement) tourBooking.tour_detail = detailElement.value;

        const noteElement = formElements[`tour_${formId}_note`];
        if (noteElement) tourBooking.note = noteElement.value;

        // เพิ่มฟิลด์อื่นๆ ในลักษณะเดียวกัน
        const typeElement = formElements[`tour_${formId}_type`];
        if (typeElement) tourBooking.tour_type = typeElement.value;

        const hotelElement = formElements[`tour_${formId}_hotel`];
        if (hotelElement) tourBooking.tour_hotel = hotelElement.value;

        const roomNoElement = formElements[`tour_${formId}_room_no`];
        if (roomNoElement) tourBooking.tour_room_no = roomNoElement.value;

        const pickupTimeElement = formElements[`tour_${formId}_pickup_time`];
        if (pickupTimeElement)
          tourBooking.tour_pickup_time = pickupTimeElement.value;

        const contactNoElement = formElements[`tour_${formId}_contact_no`];
        if (contactNoElement)
          tourBooking.tour_contact_no = contactNoElement.value;

        const sendToElement = formElements[`tour_${formId}_send_to`];
        if (sendToElement) tourBooking.send_to = sendToElement.value;

        // ตั้งค่า default สำหรับฟิลด์ที่จำเป็น
        tourBooking.status = "pending";

        tourBookings.push(tourBooking);
      }

      // สำหรับ transfer bookings ใช้แนวทางเดียวกัน
      // สำหรับ transfer bookings
      const transferBookings = [];
      for (const transferForm of transferForms) {
        const formId = transferForm.id;
        const bookingId = await generateBookingID("transfer");
        const transferDateElement = formElements[`transfer_${formId}_date`];
        const transferDate = transferDateElement
          ? transferDateElement.value
          : "";
        if (transferDate) allDates.push(transferDate);

        const transferBooking = {
          order_id: orderKey,
          transfer_date: transferDate,
          status: "pending",
          reference_id: bookingId, // เพิ่ม reference_id
        };

        // ส่วนที่เหลือคงเดิม...

        // เพิ่มฟิลด์อื่นๆ โดยใช้ Optional Chaining
        const timeElement = formElements[`transfer_${formId}_pickup_time`];
        if (timeElement) transferBooking.transfer_time = timeElement.value;

        const pickupLocationElement =
          formElements[`transfer_${formId}_pickup_location`];
        if (pickupLocationElement)
          transferBooking.pickup_location = pickupLocationElement.value;

        const dropLocationElement =
          formElements[`transfer_${formId}_drop_location`];
        if (dropLocationElement)
          transferBooking.drop_location = dropLocationElement.value;

        const detailElement = formElements[`transfer_${formId}_detail`];
        if (detailElement)
          transferBooking.transfer_detail = detailElement.value;

        const typeElement = formElements[`transfer_${formId}_type`];
        if (typeElement) transferBooking.transfer_type = typeElement.value;

        const sendToElement = formElements[`transfer_${formId}_send_to`];
        if (sendToElement) transferBooking.send_to = sendToElement.value;

        const flightElement = formElements[`transfer_${formId}_flight`];
        if (flightElement)
          transferBooking.transfer_flight = flightElement.value;

        const ftimeElement = formElements[`transfer_${formId}_transfer_ftime`];
        if (ftimeElement) transferBooking.transfer_ftime = ftimeElement.value;

        const carModelElement = formElements[`transfer_${formId}_car_model`];
        if (carModelElement) transferBooking.car_model = carModelElement.value;

        const phoneNumberElement =
          formElements[`transfer_${formId}_phone_number`];
        if (phoneNumberElement)
          transferBooking.phone_number = phoneNumberElement.value;

        const noteElement = formElements[`transfer_${formId}_note`];
        if (noteElement) transferBooking.note = noteElement.value;

        transferBookings.push(transferBooking);
      }

      // Bulk insert tour bookings if any
      if (tourBookings.length > 0) {
        const { error: tourError } = await supabase
          .from("tour_bookings")
          .insert(tourBookings);

        if (tourError) throw tourError;
      }

      // Bulk insert transfer bookings if any
      if (transferBookings.length > 0) {
        const { error: transferError } = await supabase
          .from("transfer_bookings")
          .insert(transferBookings);

        if (transferError) throw transferError;
      }

      // Update start/end dates on the order
      if (allDates.length > 0) {
        allDates.sort();
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            start_date: allDates[0],
            end_date: allDates[allDates.length - 1],
          })
          .eq("id", orderKey);
        if (updateError) throw updateError;
      }

      // Success message
      let message = "บันทึกข้อมูลสำเร็จ!\n";
      if (tourBookings.length > 0)
        message += `Tour Bookings: ${tourBookings.length}\n`;
      if (transferBookings.length > 0)
        message += `Transfer Bookings: ${transferBookings.length}\n`;

      setStatus({ loading: false, message, error: "" });
      resetForm();
      setIsBookingSectionVisible(false);
      if (orderSelectorRef.current) {
        setTimeout(() => {
          orderSelectorRef.current.refreshOrders();
        }, 500); // รออีกนิดหนึ่งเพื่อให้ข้อมูลในฐานข้อมูลอัปเดต
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus({
        loading: false,
        message: "",
        error: `เกิดข้อผิดพลาด: ${error.message}`,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Seven Smile Booking
        </h1>
        <p className="text-gray-600 mb-4">กรุณาเลือกฟอร์มที่ต้องการกรอก</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-center mb-4">เลือก Order</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="w-full md:w-2/3">
            <OrderSelector
              ref={orderSelectorRef}
              onOrderSelect={handleOrderSelect}
              onCreateNewOrder={handleCreateNewOrder}
            />
          </div>
        </div>
      </div>

      {status.message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 shadow-sm">
          <p>{status.message}</p>
        </div>
      )}

      {status.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shadow-sm">
          <p>{status.error}</p>
        </div>
      )}

      {isBookingSectionVisible && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 transition-all duration-300">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-4 text-center">
            <h2 className="text-xl font-semibold">ข้อมูลหลักของ Booking</h2>
            {currentOrderId && (
              <p className="text-gray-200 text-sm mt-1">
                Order ID: {currentOrderId}
              </p>
            )}
          </div>

          {/* แสดงข้อมูลจำนวน bookings */}
          {bookingCounts && (
            <div className="bg-gray-100 p-3 border-b border-gray-200">
              <p className="text-center text-gray-700">
                Order นี้มี{" "}
                <span className="font-bold text-green-600">
                  {bookingCounts.tourCount} ทัวร์
                </span>{" "}
                และ
                <span className="font-bold text-blue-600">
                  {" "}
                  {bookingCounts.transferCount} รถรับส่ง
                </span>{" "}
                อยู่แล้ว
              </p>
            </div>
          )}
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="agent"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Agent <span className="text-red-500">*</span>
                  </label>
                  <AutocompleteInput
                    options={agents}
                    value={mainFormData.agent}
                    onChange={handleAgentChange}
                    placeholder="เลือกหรือพิมพ์ชื่อ Agent"
                    onAddNew={handleAddNewAgent}
                    name="agent"
                    id="agent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={mainFormData.firstName}
                    onChange={handleMainFormChange}
                    className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="ชื่อลูกค้า"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={mainFormData.lastName}
                    onChange={handleMainFormChange}
                    className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="นามสกุลลูกค้า"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="pax"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Pax <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="pax"
                    name="pax"
                    value={mainFormData.pax}
                    onChange={handleMainFormChange}
                    className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="จำนวนคน"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={handleAddTourForm}
                  className="px-6 py-2 border-2 border-green-500 text-green-600 font-medium rounded-md hover:bg-green-500 hover:text-white transition flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  เพิ่มทัวร์
                </button>

                <button
                  type="button"
                  onClick={handleAddTransferForm}
                  className="px-6 py-2 border-2 border-blue-500 text-blue-600 font-medium rounded-md hover:bg-blue-500 hover:text-white transition flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  เพิ่มรถรับส่ง
                </button>
              </div>

              {(tourForms.length > 0 || transferForms.length > 0) && (
                <>
                  <BookingCounter
                    tourCount={tourForms.length}
                    transferCount={transferForms.length}
                  />

                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {tourForms.map((form) => (
                        <TourForm
                          key={form.id}
                          id={form.id}
                          data={form.data}
                          onRemove={handleRemoveTourForm}
                        />
                      ))}
                    </div>

                    <div className="space-y-4">
                      {transferForms.map((form) => (
                        <TransferForm
                          key={form.id}
                          id={form.id}
                          data={form.data}
                          onRemove={handleRemoveTransferForm}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-center mt-8">
                    <button
                      type="submit"
                      disabled={status.loading}
                      className="px-8 py-3 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 transition disabled:opacity-50 shadow-md"
                    >
                      {status.loading ? (
                        <div className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          กำลังบันทึก...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          บันทึกข้อมูล
                        </div>
                      )}
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
