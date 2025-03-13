import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useInformation } from "../../contexts/InformationContext";
import AutocompleteInput from "../common/AutocompleteInput";

const TransferForm = ({ id, onRemove, data }) => {
  const { register, setValue, getValues } = useForm();

  // ใช้ context แทนการเรียก API โดยตรง
  const {
    transferTypes,
    transferRecipients,
    places, // ใช้ places แทนที่จะแยกเป็น pickupLocations และ dropLocations
    addNewInformation,
    loading,
  } = useInformation();

  useEffect(() => {
    // ตั้งค่าข้อมูลเริ่มต้น
    if (data) {
      setValue(`transfer_${id}_date`, data.transfer_date || "");
      setValue(`transfer_${id}_pickup_time`, data.transfer_time || "");
      setValue(`transfer_${id}_pickup_location`, data.pickup_location || "");
      setValue(`transfer_${id}_drop_location`, data.drop_location || "");
      setValue(`transfer_${id}_detail`, data.transfer_detail || "");
      setValue(`transfer_${id}_type`, data.transfer_type || "");
      setValue(`transfer_${id}_send_to`, data.send_to || "");
      setValue(`transfer_${id}_flight`, data.transfer_flight || "");
      setValue(`transfer_${id}_time`, data.time || "");
      setValue(`transfer_${id}_car_model`, data.car_model || "");
      setValue(`transfer_${id}_phone_number`, data.phone_number || "");
    }
  }, [data, id, setValue]);

  const InputField = ({
    label,
    name,
    type = "text",
    required,
    placeholder,
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
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
        className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        rows="3"
        placeholder={placeholder}
      ></textarea>
    </div>
  );

  // ฟังก์ชันเพิ่มข้อมูลใหม่ในหมวดหมู่ place แทน
  const handleAddNewPlace = async (newValue, description = "") => {
    try {
      const result = await addNewInformation("place", newValue, description);
      return result;
    } catch (error) {
      console.error("Error adding new place:", error);
      return null;
    }
  };

  const handleAddNewTransferType = async (newValue) => {
    try {
      const result = await addNewInformation("transfer_type", newValue);
      return result;
    } catch (error) {
      console.error("Error adding new transfer type:", error);
      return null;
    }
  };

  const handleAddNewRecipient = async (newValue) => {
    try {
      const result = await addNewInformation("transfer_recipient", newValue);
      return result;
    } catch (error) {
      console.error("Error adding new recipient:", error);
      return null;
    }
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงค่า
  const handleInputChange = (fieldName, value) => {
    setValue(fieldName, value);
  };

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

      <div className="p-4 grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภท
            </label>
            <AutocompleteInput
              options={transferTypes}
              value={getValues(`transfer_${id}_type`) || ""}
              onChange={(value) =>
                handleInputChange(`transfer_${id}_type`, value)
              }
              placeholder="เลือกหรือพิมพ์ประเภทรถรับส่ง"
              onAddNew={handleAddNewTransferType}
              name={`transfer_${id}_type`}
              id={`transfer_${id}_type`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ส่งใคร
            </label>
            <AutocompleteInput
              options={transferRecipients}
              value={getValues(`transfer_${id}_send_to`) || ""}
              onChange={(value) =>
                handleInputChange(`transfer_${id}_send_to`, value)
              }
              placeholder="เลือกหรือพิมพ์ผู้รับ"
              onAddNew={handleAddNewRecipient}
              name={`transfer_${id}_send_to`}
              id={`transfer_${id}_send_to`}
            />
          </div>
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
            label="เที่ยวบิน"
            name={`transfer_${id}_flight`}
            placeholder="เที่ยวบิน"
          />
          <InputField
            label="เวลาบิน"
            name={`transfer_${id}_time`}
            placeholder="เวลาบิน"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รับจาก
            </label>
            <AutocompleteInput
              options={places}
              value={getValues(`transfer_${id}_pickup_location`) || ""}
              onChange={(value) =>
                handleInputChange(`transfer_${id}_pickup_location`, value)
              }
              placeholder="เลือกหรือพิมพ์สถานที่รับ"
              onAddNew={handleAddNewPlace}
              name={`transfer_${id}_pickup_location`}
              id={`transfer_${id}_pickup_location`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ไปส่งที่
            </label>
            <AutocompleteInput
              options={places}
              value={getValues(`transfer_${id}_drop_location`) || ""}
              onChange={(value) =>
                handleInputChange(`transfer_${id}_drop_location`, value)
              }
              placeholder="เลือกหรือพิมพ์สถานที่ส่ง"
              onAddNew={handleAddNewPlace}
              name={`transfer_${id}_drop_location`}
              id={`transfer_${id}_drop_location`}
            />
          </div>
          <InputField
            label="วันที่"
            name={`transfer_${id}_date`}
            type="date"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="รุ่นรถ"
            name={`transfer_${id}_car_model`}
            placeholder="รุ่นรถ"
          />
          <InputField
            label="เบอร์โทรศัพท์"
            name={`transfer_${id}_phone_number`}
            placeholder="เบอร์โทรศัพท์"
          />
        </div>
      </div>
    </div>
  );
};

export default TransferForm;
