import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Trash2,
  User,
  Calendar,
  Clock,
  Package,
  FileText,
} from "lucide-react";
import supabase from "../../config/supabaseClient";
import { formatDate } from "../../utils/dateUtils";

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

  // เพิ่ม Effect สำหรับการกดปุ่ม ESC
  useEffect(() => {
    const handleEscKeyPress = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscKeyPress);

    return () => {
      window.removeEventListener("keydown", handleEscKeyPress);
    };
  }, [onClose]);

  useEffect(() => {
    if (booking) {
      // ตั้งค่าข้อมูลฟอร์มจาก booking
      setFormData({ ...booking });

      // ตรวจสอบว่าควรแสดงฟิลด์เพิ่มเติมหรือไม่ตามสถานะ
      const status = booking.status || "pending";
      setShowAdditionalFields(
        ["booked", "in_progress", "completed"].includes(status)
      );

      // ดึงข้อมูล order เพื่อแสดงเป็นข้อมูลเพิ่มเติมเท่านั้น
      if (booking.order_id) {
        fetchOrderData(booking.order_id);
      }
    }
  }, [booking]);

  // ดึงข้อมูล order จาก Supabase
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

  // จัดการเมื่อค่าในฟอร์มเปลี่ยนแปลง
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // เปิด/ปิดฟิลด์เพิ่มเติมสำหรับ transfer bookings ตามสถานะ
    if (name === "status" && bookingType === "transfer") {
      setShowAdditionalFields(
        ["booked", "in_progress", "completed"].includes(value)
      );
    }
  };

  // จัดการการส่งฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage({ type: "info", message: "กำลังบันทึกข้อมูล..." });
    console.log("Status being sent:", formData.status);
    console.log("All form data:", formData);
    try {
      // สร้างข้อมูลใหม่โดยไม่รวมฟิลด์ orders (ถ้ามี)
      const { orders, ...bookingDataToSave } = formData;
      // เรียกใช้ onSave ที่ส่งมาจาก prop
      const result = await onSave(bookingDataToSave);

      if (result.success) {
        setStatusMessage({ type: "success", message: "บันทึกข้อมูลสำเร็จ" });

        // ปิด modal หลังจากบันทึกสำเร็จ
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

  // จัดการการลบข้อมูล
  const handleDelete = async () => {
    if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      try {
        const result = await onDelete(booking.id);

        if (result.success) {
          setStatusMessage({ type: "success", message: "ลบข้อมูลสำเร็จ" });

          // ปิด modal หลังจากลบสำเร็จ
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

  // แสดงข้อมูล Order (แสดงเป็นข้อมูลเพิ่มเติม ไม่สามารถแก้ไขได้)
  const renderOrderInfo = () => {
    if (!orderData) return null;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-medium flex items-center">
            <User size={18} className="mr-2 text-gray-600" />
            ข้อมูล Order
          </h4>
          <span className="text-sm text-gray-500">
            {/* (ข้อมูลนี้ไม่สามารถแก้ไขได้ใน modal นี้) */}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">รหัส Order:</p>
            <p className="font-medium">
              {orderData.reference_id || `#${orderData.id}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">ชื่อลูกค้า:</p>
            <p className="font-medium">
              {orderData.first_name} {orderData.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Agent:</p>
            <p className="font-medium">{orderData.agent_name || "-"}</p>
          </div>
        </div>
      </div>
    );
  };

  // กำหนดกลุ่มฟิลด์สำหรับแสดงตามประเภทของ booking
  const getFieldGroups = () => {
    if (bookingType === "tour") {
      return [
        {
          title: "ข้อมูลหลัก",
          icon: <Calendar size={18} className="mr-2 text-green-600" />,
          fields: [
            {
              name: "reference_id",
              label: "รหัสการจอง",
              readOnly: true,
              value: booking.reference_id || `#${booking.id}`,
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
          icon: <Package size={18} className="mr-2 text-green-600" />,
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
        {
          title: "ราคาและหมายเหตุ",
          icon: <FileText size={18} className="mr-2 text-green-600" />,
          fields: [
            { name: "cost_price", label: "ราคาต้นทุน", type: "number" },
            { name: "selling_price", label: "ราคาขาย", type: "number" },
            { name: "note", label: "หมายเหตุ", type: "textarea" },
          ],
        },
      ];
    } else {
      return [
        {
          title: "ข้อมูลหลัก",
          icon: <Calendar size={18} className="mr-2 text-blue-600" />,
          fields: [
            {
              name: "reference_id",
              label: "รหัสการจอง",
              readOnly: true,
              value: booking.reference_id || `#${booking.id}`,
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
          icon: <Clock size={18} className="mr-2 text-blue-600" />,
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
          title: "ข้อมูลคนขับ",
          icon: <User size={18} className="mr-2 text-blue-600" />,
          className: showAdditionalFields ? "" : "hidden",
          fields: [
            { name: "driver_name", label: "ชื่อคนขับ" },
            { name: "license_plate", label: "ทะเบียนรถ" },
            { name: "car_model", label: "รุ่นรถ" },
            { name: "phone_number", label: "เบอร์โทร" },
          ],
        },
        {
          title: "ราคาและหมายเหตุ",
          icon: <FileText size={18} className="mr-2 text-blue-600" />,
          fields: [
            { name: "cost_price", label: "ราคาต้นทุน", type: "number" },
            { name: "selling_price", label: "ราคาขาย", type: "number" },
            { name: "note", label: "หมายเหตุ", type: "textarea" },
          ],
        },
      ];
    }
  };

  // สร้าง form field ตามประเภท
  const renderField = (field) => {
    const {
      name,
      label,
      type = "text",
      readOnly = false,
      options = [],
      value: explicitValue,
    } = field;

    const fieldValue =
      explicitValue !== undefined ? explicitValue : formData[name] || "";

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

  // ฟังก์ชันแปลงสถานะเป็นภาษาไทย
  const getStatusText = (status) => {
    const statusMap = {
      pending: "รอดำเนินการ",
      booked: "จองแล้ว",
      in_progress: "ดำเนินการอยู่",
      completed: "เสร็จสมบูรณ์",
      cancelled: "ยกเลิก",
    };
    return statusMap[status] || status;
  };

  // ฟังก์ชันสร้างสี badge ตามสถานะ
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "booked":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto modal-backdrop bg-black bg-opacity-30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div
          className={`px-4 py-3 border-b flex justify-between items-center ${
            bookingType === "tour" ? "bg-green-600" : "bg-blue-600"
          } text-white rounded-t-lg`}
        >
          <div className="flex justify-center items-center">
            <span className="text-xl font-semibold mr-2">
              {bookingType === "tour"
                ? "รายละเอียดการจองทัวร์"
                : "รายละเอียดการจองรถรับส่ง"}
            </span>
            {booking.status && (
              <span
                className={`text-xs px-2 py-1 rounded-md ${getStatusBadgeClass(
                  booking.status
                )}`}
              >
                {getStatusText(booking.status)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* แสดงข้อมูล Order (เป็นข้อมูลเพิ่มเติม ไม่สามารถแก้ไขได้) */}
          {renderOrderInfo()}

          {/* แสดงฟิลด์ต่างๆ ของ Booking ที่สามารถแก้ไขได้ */}
          {getFieldGroups().map((group, groupIndex) => (
            <div key={groupIndex} className={`mb-6 ${group.className || ""}`}>
              <h4 className="text-lg font-medium mb-3 pb-2 border-b border-gray-200 flex items-center">
                {group.icon}
                {group.title}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2  gap-4">
                {group.fields.map((field) => (
                  <div key={field.name} className="mb-3  ">
                    <label
                      htmlFor={`field-${field.name}`}
                      className="block text-sm  font-medium text-gray-700 mb-1"
                    >
                      {field.label}
                    </label>
                    <div className="border rounded-md border-gray-300">
                      {renderField(field)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* แสดงข้อความสถานะ */}
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

          {/* ปุ่มดำเนินการ */}
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
