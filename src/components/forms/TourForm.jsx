import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useInformation } from "../../contexts/InformationContext";
import AutocompleteInput from "../common/AutocompleteInput";

const TourForm = ({ id, onRemove, data }) => {
  const { register, setValue, getValues } = useForm();

  // ใช้ context แทนการเรียก API โดยตรง
  const { tourTypes, tourRecipients, places, addNewInformation, loading } =
    useInformation();

  useEffect(() => {
    // ตั้งค่าข้อมูลเริ่มต้น
    if (data) {
      setValue(`tour_${id}_date`, data.tour_date || "");
      setValue(`tour_${id}_detail`, data.tour_detail || "");
      setValue(`tour_${id}_pickup_time`, data.pickup_time || "");
      setValue(`tour_${id}_hotel`, data.hotel || "");
      setValue(`tour_${id}_room_no`, data.room_no || "");
      setValue(`tour_${id}_contact_no`, data.contact_no || "");
      setValue(`tour_${id}_send_to`, data.send_to || "");
      setValue(`tour_${id}_type`, data.tour_type || "");
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

  // ฟังก์ชันเพิ่มข้อมูลใหม่
  const handleAddNewTourType = async (newValue) => {
    try {
      const result = await addNewInformation("tour_type", newValue);
      return result;
    } catch (error) {
      console.error("Error adding new tour type:", error);
      return null;
    }
  };

  const handleAddNewPlace = async (newValue) => {
    try {
      const result = await addNewInformation("place", newValue);
      return result;
    } catch (error) {
      console.error("Error adding new place:", error);
      return null;
    }
  };

  const handleAddNewRecipient = async (newValue) => {
    try {
      const result = await addNewInformation("tour_recipient", newValue);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภท
            </label>
            <AutocompleteInput
              options={tourTypes}
              value={getValues(`tour_${id}_type`) || ""}
              onChange={(value) => handleInputChange(`tour_${id}_type`, value)}
              placeholder="เลือกหรือพิมพ์ประเภททัวร์"
              onAddNew={handleAddNewTourType}
              name={`tour_${id}_type`}
              id={`tour_${id}_type`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ส่งใคร
            </label>
            <AutocompleteInput
              options={tourRecipients}
              value={getValues(`tour_${id}_send_to`) || ""}
              onChange={(value) =>
                handleInputChange(`tour_${id}_send_to`, value)
              }
              placeholder="เลือกหรือพิมพ์ผู้รับ"
              onAddNew={handleAddNewRecipient}
              name={`tour_${id}_send_to`}
              id={`tour_${id}_send_to`}
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              โรงแรม
            </label>
            <AutocompleteInput
              options={places}
              value={getValues(`tour_${id}_hotel`) || ""}
              onChange={(value) => handleInputChange(`tour_${id}_hotel`, value)}
              placeholder="เลือกหรือพิมพ์ชื่อโรงแรม"
              onAddNew={handleAddNewPlace}
              name={`tour_${id}_hotel`}
              id={`tour_${id}_hotel`}
            />
          </div>
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
            label="วันที่"
            name={`tour_${id}_date`}
            type="date"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default TourForm;
