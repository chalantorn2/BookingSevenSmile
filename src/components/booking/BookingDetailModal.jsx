import React, { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import supabase from "../../config/supabaseClient";

const BookingDetailModal = ({
  booking,
  bookingType,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (booking) {
      setFormData({ ...booking });

      // Check if we should show additional fields based on status
      const status = booking.status || "pending";
      setShowAdditionalFields(
        ["booked", "in_progress", "completed"].includes(status)
      );

      // ดึงข้อมูล order ถ้ายังไม่มี
      if (booking.order_id && (!booking.orders || !booking.orders.pax)) {
        fetchOrderData(booking.order_id);
      } else if (booking.orders) {
        setOrderData(booking.orders);
      }
    }
  }, [booking]);

  const fetchOrderData = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;

      setOrderData(data);
    } catch (error) {
      console.error("Error fetching order data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Toggle additional fields visibility for transfer bookings
    if (name === "status" && bookingType === "transfer") {
      setShowAdditionalFields(
        ["booked", "in_progress", "completed"].includes(value)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage({ type: "info", message: "กำลังบันทึกข้อมูล..." });

    try {
      const result = await onSave(formData);

      if (result.success) {
        setStatusMessage({ type: "success", message: "บันทึกข้อมูลสำเร็จ" });

        // Close the modal after success message
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMessage({
          type: "error",
          message: `เกิดข้อผิดพลาด: ${
            result.error || "ไม่สามารถบันทึกข้อมูลได้"
          }`,
        });
      }
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: `เกิดข้อผิดพลาด: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      try {
        const result = await onDelete(booking.id);

        if (result.success) {
          setStatusMessage({ type: "success", message: "ลบข้อมูลสำเร็จ" });

          // Close the modal after success message
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setStatusMessage({
            type: "error",
            message: `เกิดข้อผิดพลาด: ${
              result.error || "ไม่สามารถลบข้อมูลได้"
            }`,
          });
        }
      } catch (error) {
        setStatusMessage({
          type: "error",
          message: `เกิดข้อผิดพลาด: ${error.message}`,
        });
      }
    }
  };

  // Define field groups based on booking type
  // แก้ไขส่วน getFieldGroups ในไฟล์ BookingDetailModal.jsx

  const getFieldGroups = () => {
    const paxValue = orderData ? orderData.pax : booking.orders?.pax || "";
    if (bookingType === "tour") {
      return [
        {
          title: "ข้อมูลหลัก",
          fields: [
            { name: "id", label: "รหัสการจอง", readOnly: true },
            { name: "order_id", label: "รหัส Order", readOnly: true },
            // เพิ่มฟิลด์แสดง pax จาก order แบบ readOnly
            {
              name: "order_pax",
              label: "จำนวนคน",
              type: "number",
              value: paxValue,
              readOnly: true,
            },
            {
              name: "status",
              label: "สถานะ",
              type: "select",
              options: [
                { value: "pending", label: "รอดำเนินการ" },
                { value: "booked", label: "จองแล้ว" },
                { value: "in_progress", label: "ดำเนินการอยู่" },
                { value: "completed", label: "เสร็จสมบูรณ์" },
                { value: "cancelled", label: "ยกเลิก" },
              ],
            },
            { name: "tour_date", label: "วันที่", type: "date" },
            { name: "tour_pickup_time", label: "เวลารับ" },
          ],
        },
        {
          title: "รายละเอียดทัวร์",
          fields: [
            { name: "tour_type", label: "ประเภททัวร์" },
            { name: "tour_detail", label: "รายละเอียด", type: "textarea" },
            { name: "pax", label: "จำนวนคน", type: "number" },
            { name: "tour_hotel", label: "โรงแรม" },
            { name: "tour_room_no", label: "หมายเลขห้อง" },
            { name: "tour_contact_no", label: "เบอร์ติดต่อ" },
            { name: "send_to", label: "ส่งใคร" },
          ],
        },
      ];
    } else {
      return [
        {
          title: "ข้อมูลหลัก",
          fields: [
            { name: "id", label: "รหัสการจอง", readOnly: true },
            { name: "order_id", label: "รหัส Order", readOnly: true },
            // เพิ่มฟิลด์แสดง pax จาก order แบบ readOnly
            {
              name: "order_pax",
              label: "จำนวนคน",
              type: "number",
              value: paxValue,
              readOnly: true,
            },
            {
              name: "status",
              label: "สถานะ",
              type: "select",
              options: [
                { value: "pending", label: "รอดำเนินการ" },
                { value: "booked", label: "จองแล้ว" },
                { value: "in_progress", label: "ดำเนินการอยู่" },
                { value: "completed", label: "เสร็จสมบูรณ์" },
                { value: "cancelled", label: "ยกเลิก" },
              ],
            },
            { name: "transfer_date", label: "วันที่", type: "date" },
            { name: "transfer_time", label: "เวลารับ" },
          ],
        },
        {
          title: "รายละเอียดการรับส่ง",
          fields: [
            { name: "transfer_type", label: "ประเภทการรับส่ง" },
            { name: "transfer_detail", label: "รายละเอียด", type: "textarea" },
            { name: "pax", label: "จำนวนคน", type: "number" },
            { name: "pickup_location", label: "สถานที่รับ" },
            { name: "drop_location", label: "สถานที่ส่ง" },
            { name: "transfer_flight", label: "เที่ยวบิน" },
            { name: "send_to", label: "ส่งใคร" },
          ],
        },
        {
          title: "ข้อมูลเพิ่มเติม",
          className: showAdditionalFields ? "" : "hidden",
          fields: [
            { name: "car_model", label: "รุ่นรถ" },
            { name: "phone_number", label: "เบอร์โทร" },
          ],
        },
      ];
    }
  };

  // Render form field based on type
  const renderField = (field) => {
    const {
      name,
      label,
      type = "text",
      readOnly = false,
      options = [],
      value, // เพิ่ม parameter นี้เพื่อรองรับการกำหนดค่า
    } = field;

    const fieldValue = value !== undefined ? value : formData[name] || "";

    switch (type) {
      case "textarea":
        return (
          <textarea
            name={name}
            id={`field-${name}`}
            value={fieldValue}
            onChange={handleChange}
            readOnly={readOnly}
            className={`w-full rounded-md ${
              readOnly
                ? "bg-gray-100 border-gray-300"
                : "border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
            } p-2`}
            rows={3}
          />
        );
      case "select":
        return (
          <select
            name={name}
            id={`field-${name}`}
            value={fieldValue}
            onChange={handleChange}
            disabled={readOnly}
            className={`w-full rounded-md ${
              readOnly
                ? "bg-gray-100 border-gray-300"
                : "border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
            } p-2`}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={type}
            name={name}
            id={`field-${name}`}
            value={fieldValue}
            onChange={handleChange}
            readOnly={readOnly}
            className={`w-full rounded-md ${
              readOnly
                ? "bg-gray-100 border-gray-300"
                : "border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
            } p-2`}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div
          className={`px-4 py-3 border-b flex justify-between items-center ${
            bookingType === "tour" ? "bg-green-600" : "bg-blue-600"
          } text-white rounded-t-lg`}
        >
          <h3 className="text-xl font-semibold">
            {bookingType === "tour"
              ? "รายละเอียดการจองทัวร์"
              : "รายละเอียดการจองรถรับส่ง"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {getFieldGroups().map((group, groupIndex) => (
            <div key={groupIndex} className={`mb-6 ${group.className || ""}`}>
              <h4 className="text-lg font-medium mb-3 pb-2 border-b border-gray-200">
                {group.title}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map((field) => (
                  <div key={field.name} className="mb-3">
                    <label
                      htmlFor={`field-${field.name}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {field.label}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {statusMessage.message && (
            <div
              className={`p-3 rounded mb-4 ${
                statusMessage.type === "success"
                  ? "bg-green-100 text-green-700"
                  : statusMessage.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {statusMessage.message}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              <Trash2 size={18} className="mr-2" />
              ลบรายการ
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ปิด
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center px-6 py-2 ${
                  bookingType === "tour" ? "bg-green-600" : "bg-blue-600"
                } text-white rounded hover:opacity-90 transition-colors disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  </span>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    บันทึกข้อมูล
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingDetailModal;
