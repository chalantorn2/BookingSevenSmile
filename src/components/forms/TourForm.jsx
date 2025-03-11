import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

const InputField = ({ label, name, type = "text", required, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
      required={required}
    />
  </div>
);
const TextAreaField = ({ label, name, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      name={name}
      className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
      rows="3"
      placeholder={placeholder}
    ></textarea>
  </div>
);
const TourForm = ({ id, onRemove, data }) => {
  const { register, setValue } = useForm();
  useEffect(() => {
    if (data) {
      // ตั้งค่าข้อมูลสำหรับฟิลด์ต่างๆ
      setValue(`tour_${id}_date`, data.tour_date || "");
      setValue(`tour_${id}_detail`, data.tour_detail || "");
      setValue(`tour_${id}_pickup_time`, data.pickup_time || "");
      setValue(`tour_${id}_hotel`, data.hotel || "");
      setValue(`tour_${id}_room_no`, data.room_no || "");
      setValue(`tour_${id}_contact_no`, data.contact_no || "");
      setValue(`tour_${id}_send_to`, data.send_to || "");
      setValue(`tour_${id}_cost_price`, data.cost_price || "");
      setValue(`tour_${id}_selling_price`, data.selling_price || "");
      setValue(`tour_${id}_note`, data.note || "");
    }
  }, [data, id, setValue]);

  return (
    <div
      className="bg-white rounded-lg shadow-md border border-green-300 hover:shadow-lg transition-all duration-300"
      id={`tour-${id}`}
    >
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 flex justify-between items-center">
        <h3 className="text-lg font-medium">Tour Booking #{id}</h3>
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded text-sm"
        >
          ลบ
        </button>
      </div>

      <div className="p-4 grid gap-4">
        <div className="grid  grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="ประเภท"
            name={`tour_${id}_type`}
            placeholder="ระบุประเภททัวร์"
          />
          <InputField
            label="วันที่"
            name={`tour_${id}_date`}
            type="date"
            required
          />
        </div>

        <TextAreaField
          label="รายละเอียด"
          name={`tour_${id}_detail`}
          type="textarea"
          placeholder="รายละเอียดเพิ่มเติม"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InputField
            label="เวลารับ"
            name={`tour_${id}_pickup_time`}
            placeholder="เวลารับ"
          />
          <InputField
            label="โรงแรม"
            name={`tour_${id}_hotel`}
            placeholder="ชื่อโรงแรม"
          />
          <InputField
            label="หมายเลขห้อง"
            name={`tour_${id}_room_no`}
            placeholder="เลขห้อง"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label="เบอร์ติดต่อ"
            name={`tour_${id}_contact_no`}
            placeholder="เบอร์โทรศัพท์"
          />
          <InputField
            label="ส่งใคร"
            name={`tour_${id}_send_to`}
            placeholder="ชื่อผู้รับ"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InputField
            label="ราคาต้นทุน"
            name={`tour_${id}_cost_price`}
            type="number"
          />
          <InputField
            label="ราคาขาย"
            name={`tour_${id}_selling_price`}
            type="number"
          />
          <InputField
            label="หมายเหตุ"
            name={`tour_${id}_note`}
            placeholder="หมายเหตุ"
          />
        </div>
      </div>
    </div>
  );
};

export default TourForm;
