import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  fetchInformationByCategory,
  addInformation,
} from "../../services/informationService";

const TransferForm = ({ id, onRemove, data }) => {
  const { register, setValue } = useForm();
  const [transferTypes, setTransferTypes] = useState([]);
  const [transferRecipients, setTransferRecipients] = useState([]);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [dropLocations, setDropLocations] = useState([]);

  // สถานะสำหรับการ*เพิ่มข้อมูลใหม่*
  const [newTransferType, setNewTransferType] = useState("");
  const [isAddingNewTransferType, setIsAddingNewTransferType] = useState(false);
  const [newPickupLocation, setNewPickupLocation] = useState("");
  const [isAddingNewPickupLocation, setIsAddingNewPickupLocation] =
    useState(false);
  const [newDropLocation, setNewDropLocation] = useState("");
  const [isAddingNewDropLocation, setIsAddingNewDropLocation] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [isAddingNewRecipient, setIsAddingNewRecipient] = useState(false);

  useEffect(() => {
    // ดึงข้อมูลประเภทรถรับส่ง
    fetchInformationByCategory("transfer_type").then(({ data }) => {
      if (data) setTransferTypes(data);
    });

    // ดึงข้อมูลส่งใคร (Transfer)
    fetchInformationByCategory("transfer_recipient").then(({ data }) => {
      if (data) setTransferRecipients(data);
    });

    // ดึงข้อมูลสถานที่รับ
    fetchInformationByCategory("pickup_location").then(({ data }) => {
      if (data) setPickupLocations(data);
    });

    // ดึงข้อมูลสถานที่ส่ง
    fetchInformationByCategory("drop_location").then(({ data }) => {
      if (data) setDropLocations(data);
    });

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
            {!isAddingNewTransferType ? (
              <select
                name={`transfer_${id}_type`}
                className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                onChange={(e) => {
                  if (e.target.value === "add_new") {
                    setIsAddingNewTransferType(true);
                  }
                }}
              >
                <option value="" className="">
                  เลือกประเภท
                </option>
                {transferTypes.map((type) => (
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
                  value={newTransferType}
                  onChange={(e) => setNewTransferType(e.target.value)}
                  className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  placeholder="ประเภทรถรับส่งใหม่"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTransferType.trim()) {
                      addInformation({
                        category: "transfer_type",
                        value: newTransferType.trim(),
                        active: true,
                      }).then(({ data }) => {
                        if (data) {
                          setTransferTypes([...transferTypes, data]);
                          setValue(`transfer_${id}_type`, data.value);
                        }
                      });
                    }
                    setIsAddingNewTransferType(false);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md"
                >
                  เพิ่ม
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewTransferType(false)}
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
                name={`transfer_${id}_send_to`}
                className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                onChange={(e) => {
                  if (e.target.value === "add_new") {
                    setIsAddingNewRecipient(true);
                  }
                }}
              >
                <option value=""> เลือกผู้รับ </option>
                {transferRecipients.map((recipient) => (
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
                  className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  placeholder="ผู้รับใหม่"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newRecipient.trim()) {
                      addInformation({
                        category: "transfer_recipient",
                        value: newRecipient.trim(),
                        active: true,
                      }).then(({ data }) => {
                        if (data) {
                          setTransferRecipients([...transferRecipients, data]);
                          setValue(`transfer_${id}_send_to`, data.value);
                        }
                      });
                    }
                    setIsAddingNewRecipient(false);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md"
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
            {!isAddingNewPickupLocation ? (
              <select
                name={`transfer_${id}_pickup_location`}
                className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                onChange={(e) => {
                  if (e.target.value === "add_new") {
                    setIsAddingNewPickupLocation(true);
                  }
                }}
              >
                <option value=""> เลือกสถานที่รับ </option>
                {pickupLocations.map((location) => (
                  <option key={location.id} value={location.value}>
                    {location.value}
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
                  value={newPickupLocation}
                  onChange={(e) => setNewPickupLocation(e.target.value)}
                  className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  placeholder="สถานที่รับใหม่"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPickupLocation.trim()) {
                      addInformation({
                        category: "pickup_location",
                        value: newPickupLocation.trim(),
                        active: true,
                      }).then(({ data }) => {
                        if (data) {
                          setPickupLocations([...pickupLocations, data]);
                          setValue(
                            `transfer_${id}_pickup_location`,
                            data.value
                          );
                        }
                      });
                    }
                    setIsAddingNewPickupLocation(false);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md"
                >
                  เพิ่ม
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewPickupLocation(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ไปส่งที่
            </label>
            {!isAddingNewDropLocation ? (
              <select
                name={`transfer_${id}_drop_location`}
                className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                onChange={(e) => {
                  if (e.target.value === "add_new") {
                    setIsAddingNewDropLocation(true);
                  }
                }}
              >
                <option value=""> เลือกสถานที่ส่ง </option>
                {dropLocations.map((location) => (
                  <option key={location.id} value={location.value}>
                    {location.value}
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
                  value={newDropLocation}
                  onChange={(e) => setNewDropLocation(e.target.value)}
                  className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  placeholder="สถานที่ส่งใหม่"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDropLocation.trim()) {
                      addInformation({
                        category: "drop_location",
                        value: newDropLocation.trim(),
                        active: true,
                      }).then(({ data }) => {
                        if (data) {
                          setDropLocations([...dropLocations, data]);
                          setValue(`transfer_${id}_drop_location`, data.value);
                        }
                      });
                    }
                    setIsAddingNewDropLocation(false);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md"
                >
                  เพิ่ม
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewDropLocation(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
          <InputField
            label="วันที่"
            name={`transfer_${id}_date`}
            type="date"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default TransferForm;
