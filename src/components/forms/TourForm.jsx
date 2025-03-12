import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  fetchInformationByCategory,
  addInformation,
} from "../../services/informationService";

const TourForm = ({ id, onRemove, data }) => {
  const { register, setValue } = useForm();
  const [tourTypes, setTourTypes] = useState([]);
  const [tourRecipients, setTourRecipients] = useState([]);
  const [hotels, setHotels] = useState([]);

  // สถานะสำหรับการเพิ่มข้อมูลใหม่
  const [newTourType, setNewTourType] = useState("");
  const [isAddingNewTourType, setIsAddingNewTourType] = useState(false);
  const [newHotel, setNewHotel] = useState("");
  const [isAddingNewHotel, setIsAddingNewHotel] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [isAddingNewRecipient, setIsAddingNewRecipient] = useState(false);

  useEffect(() => {
    // ดึงข้อมูลประเภททัวร์
    fetchInformationByCategory("tour_type").then(({ data }) => {
      if (data) setTourTypes(data);
    });

    // ดึงข้อมูลส่งใคร (Tour)
    fetchInformationByCategory("tour_recipient").then(({ data }) => {
      if (data) setTourRecipients(data);
    });

    // ดึงข้อมูลโรงแรม
    fetchInformationByCategory("hotel").then(({ data }) => {
      if (data) setHotels(data);
    });

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
            {!isAddingNewTourType ? (
              <select
                name={`tour_${id}_type`}
                className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                onChange={(e) => {
                  if (e.target.value === "add_new") {
                    setIsAddingNewTourType(true);
                  }
                }}
              >
                <option value=""> เลือกประเภท </option>
                {tourTypes.map((type) => (
                  <option key={type.id} value={type.value}>
                    {type.value}
                  </option>
                ))}
                <option value="add_new" className="text-gray-600 italic">
                  {" "}
                  *เพิ่มข้อมูลใหม่*{" "}
                </option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTourType}
                  onChange={(e) => setNewTourType(e.target.value)}
                  className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
                  placeholder="ประเภททัวร์ใหม่"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTourType.trim()) {
                      addInformation({
                        category: "tour_type",
                        value: newTourType.trim(),
                        active: true,
                      }).then(({ data }) => {
                        if (data) {
                          setTourTypes([...tourTypes, data]);
                          setValue(`tour_${id}_type`, data.value);
                        }
                      });
                    }
                    setIsAddingNewTourType(false);
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded-md"
                >
                  เพิ่ม
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewTourType(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ส่งใคร
            </label>
            {!isAddingNewRecipient ? (
              <select
                name={`tour_${id}_send_to`}
                className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                onChange={(e) => {
                  if (e.target.value === "add_new") {
                    setIsAddingNewRecipient(true);
                  }
                }}
              >
                <option value=""> เลือกผู้รับ </option>
                {tourRecipients.map((recipient) => (
                  <option key={recipient.id} value={recipient.value}>
                    {recipient.value}
                  </option>
                ))}
                <option value="add_new" className="text-gray-600 italic">
                  {" "}
                  *เพิ่มข้อมูลใหม่*{" "}
                </option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
                  placeholder="ผู้รับใหม่"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newRecipient.trim()) {
                      addInformation({
                        category: "tour_recipient",
                        value: newRecipient.trim(),
                        active: true,
                      }).then(({ data }) => {
                        if (data) {
                          setTourRecipients([...tourRecipients, data]);
                          setValue(`tour_${id}_send_to`, data.value);
                        }
                      });
                    }
                    setIsAddingNewRecipient(false);
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded-md"
                >
                  เพิ่ม
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewRecipient(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md"
                >
                  ยกเลิก
                </button>
              </div>
            )}
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
            {!isAddingNewHotel ? (
              <select
                name={`tour_${id}_hotel`}
                className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                onChange={(e) => {
                  if (e.target.value === "add_new") {
                    setIsAddingNewHotel(true);
                  }
                }}
              >
                <option value=""> เลือกโรงแรม </option>
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.value}>
                    {hotel.value}
                  </option>
                ))}
                <option value="add_new" className="text-gray-600 italic">
                  {" "}
                  *เพิ่มข้อมูลใหม่*{" "}
                </option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHotel}
                  onChange={(e) => setNewHotel(e.target.value)}
                  className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
                  placeholder="ชื่อโรงแรมใหม่"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newHotel.trim()) {
                      addInformation({
                        category: "hotel",
                        value: newHotel.trim(),
                        active: true,
                      }).then(({ data }) => {
                        if (data) {
                          setHotels([...hotels, data]);
                          setValue(`tour_${id}_hotel`, data.value);
                        }
                      });
                    }
                    setIsAddingNewHotel(false);
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded-md"
                >
                  เพิ่ม
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewHotel(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md"
                >
                  ยกเลิก
                </button>
              </div>
            )}
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
