import React from "react";
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
      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
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
      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
      rows="3"
      placeholder={placeholder}
    ></textarea>
  </div>
);

const TransferForm = ({ id, onRemove }) => {
  const { register, handleSubmit } = useForm();

  return (
    <div className="bg-white rounded-lg shadow-md border border-blue-300 hover:shadow-lg transition-all duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 flex justify-between items-center">
        <h3 className="text-lg font-medium">Transfer Booking #{id}</h3>
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded text-sm"
        >
          ลบ
        </button>
      </div>

      <form
        onSubmit={handleSubmit((data) => console.log(data))}
        className="p-4 grid gap-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="ประเภท"
            name={`transfer_${id}_type`}
            placeholder="ระบุประเภท"
          />
          <InputField
            label="ส่งใคร"
            name={`transfer_${id}_send_to`}
            placeholder="ชื่อผู้รับ"
          />
        </div>

        <TextAreaField
          label="รายละเอียด"
          name={`transfer_${id}_detail`}
          placeholder="รายละเอียดเพิ่มเติม"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="เวลารับ"
            name={`transfer_${id}_pickup_time`}
            placeholder="เวลารับ"
          />
          <InputField
            label="วันที่"
            name={`transfer_${id}_date`}
            type="date"
            required
          />
          <InputField
            label="เที่ยวบิน"
            name={`transfer_${id}_flight`}
            placeholder="เที่ยวบิน"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="เวลาบิน"
            name={`transfer_${id}_time`}
            placeholder="เวลาบิน"
          />
          <InputField
            label="รับจาก"
            name={`transfer_${id}_pickup_location`}
            placeholder="สถานที่รับ"
          />
          <InputField
            label="ไปส่งที่"
            name={`transfer_${id}_drop_location`}
            placeholder="สถานที่ส่ง"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="ชื่อคนขับ"
            name={`transfer_${id}_driver_name`}
            placeholder="ชื่อคนขับ"
          />
          <InputField
            label="ทะเบียนรถ"
            name={`transfer_${id}_license_plate`}
            placeholder="ทะเบียนรถ"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="ราคาต้นทุน"
            name={`transfer_${id}_cost_price`}
            type="number"
          />
          <InputField
            label="ราคาขาย"
            name={`transfer_${id}_selling_price`}
            type="number"
          />
          <InputField
            label="หมายเหตุ"
            name={`transfer_${id}_note`}
            placeholder="หมายเหตุ"
          />
        </div>
      </form>
    </div>
  );
};

export default TransferForm;
