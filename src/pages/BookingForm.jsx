import React, { useState, useEffect } from "react";
import supabase from "../config/supabaseClient";
import OrderSelector from "../components/forms/OrderSelector";
import TourForm from "../components/forms/TourForm";
import TransferForm from "../components/forms/TransferForm";
import BookingCounter from "../components/ui/BookingCounter";
import { generateOrderID, generateBookingID } from "../utils/idGenerator";
import { fetchInformationByCategory } from "../services/informationService";

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
  const [agents, setAgents] = useState([]);
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    error: "",
  });
  const [bookingCounts, setBookingCounts] = useState(null);

  useEffect(() => {
    // ดึงข้อมูล Agent สำหรับใช้ในฟอร์ม
    fetchInformationByCategory("agent").then(({ data }) => {
      if (data) setAgents(data);
    });
  }, []);

  const handleOrderSelect = (orderKey, orderId, counts) => {
    if (orderKey) {
      setCurrentOrderKey(orderKey);
      setCurrentOrderId(orderId);
      setBookingCounts(counts);
      setIsBookingSectionVisible(true);

      // ดึงข้อมูลพื้นฐานของ Order
      loadOrderBasicDetails(orderKey);
    } else {
      resetForm();
      setIsBookingSectionVisible(false);
      setBookingCounts(null);
    }
  };

  const handleCreateNewOrder = () => {
    resetForm();
    setCurrentOrderKey(null);
    setCurrentOrderId(null);
    setIsBookingSectionVisible(true);
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
        pax: "", // ผู้ใช้กรอกเอง
      });

      // ไม่ดึงข้อมูล bookings
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

  const handleRemoveTourForm = (id) => {
    setTourForms(tourForms.filter((form) => form.id !== id));
  };

  const handleRemoveTransferForm = (id) => {
    setTransferForms(transferForms.filter((form) => form.id !== id));
  };

  const handleMainFormChange = (e) => {
    const { name, value } = e.target;
    setMainFormData({ ...mainFormData, [name]: value });
  };

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
          })
          .select()
          .single();

        if (orderError) throw orderError;

        orderKey = newOrder.id;
        setCurrentOrderKey(orderKey);
        setCurrentOrderId(referenceId);
      }

      // Collect all dates for start/end date calculation
      const allDates = [];
      const formElements = document.forms[0].elements;

      // Process tour bookings
      const tourBookings = [];
      for (const tourForm of tourForms) {
        const formId = tourForm.id;
        const bookingId = await generateBookingID("tour");

        const tourDate = formElements[`tour_${formId}_date`].value;
        if (tourDate) allDates.push(tourDate);

        tourBookings.push({
          order_id: orderKey,
          tour_date: tourDate,
          tour_detail: formElements[`tour_${formId}_detail`].value,
          pax: parseInt(mainFormData.pax) || 0,
          status: "pending",
          tour_type: formElements[`tour_${formId}_type`].value,
          tour_hotel: formElements[`tour_${formId}_hotel`].value,
          tour_room_no: formElements[`tour_${formId}_room_no`].value,
          tour_pickup_time: formElements[`tour_${formId}_pickup_time`].value,
          tour_contact_no: formElements[`tour_${formId}_contact_no`].value,
          send_to: formElements[`tour_${formId}_send_to`].value,
        });
      }

      // Process transfer bookings
      const transferBookings = [];
      for (const transferForm of transferForms) {
        const formId = transferForm.id;
        const bookingId = await generateBookingID("transfer");

        const transferDate = formElements[`transfer_${formId}_date`].value;
        if (transferDate) allDates.push(transferDate);

        transferBookings.push({
          order_id: orderKey,
          transfer_date: transferDate,
          transfer_time: formElements[`transfer_${formId}_pickup_time`].value,
          pickup_location:
            formElements[`transfer_${formId}_pickup_location`].value,
          drop_location: formElements[`transfer_${formId}_drop_location`].value,
          pax: parseInt(mainFormData.pax) || 0,
          transfer_detail: formElements[`transfer_${formId}_detail`].value,
          status: "pending",
          transfer_type: formElements[`transfer_${formId}_type`].value,
          send_to: formElements[`transfer_${formId}_send_to`].value,
          transfer_flight: formElements[`transfer_${formId}_flight`].value,
          car_model: formElements[`transfer_${formId}_car_model`].value,
          phone_number: formElements[`transfer_${formId}_phone_number`].value,
        });
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

        <div className="flex justify-center gap-4 mb-6">
          <a
            href="/"
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition"
          >
            หน้าหลัก
          </a>
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

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-center mb-4">เลือก Order</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="w-full md:w-2/3">
            <OrderSelector
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
                  <select
                    id="agent"
                    name="agent"
                    value={mainFormData.agent}
                    onChange={handleMainFormChange}
                    className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                  >
                    <option value="">-- เลือก Agent --</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.value}>
                        {agent.value}
                      </option>
                    ))}
                  </select>
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
                    className="block  text-sm font-medium text-gray-700 mb-1"
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
