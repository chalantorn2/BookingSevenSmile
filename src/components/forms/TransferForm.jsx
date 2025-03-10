import React from "react";

const TransferForm = ({ id, onRemove }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-md mb-4 overflow-hidden border border-blue-300"
      id={`transfer-${id}`}
    >
      <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
        <h3 className="text-lg font-medium">Transfer Booking #{id}</h3>
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded text-sm"
        >
          ลบ
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภท
            </label>
            <input
              type="text"
              name={`transfer_${id}_type`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ส่งใคร
            </label>
            <input
              type="text"
              name={`transfer_${id}_send_to`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รายละเอียด
            </label>
            <textarea
              name={`transfer_${id}_detail`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              rows="3"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เวลารับ
            </label>
            <input
              type="text"
              name={`transfer_${id}_pickup_time`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่ <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name={`transfer_${id}_date`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เที่ยวบิน
            </label>
            <input
              type="text"
              name={`transfer_${id}_flight`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เวลาบิน
            </label>
            <input
              type="text"
              name={`transfer_${id}_time`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รับจาก
            </label>
            <input
              type="text"
              name={`transfer_${id}_pickup_location`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ไปส่งที่
            </label>
            <input
              type="text"
              name={`transfer_${id}_drop_location`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อคนขับ
            </label>
            <input
              type="text"
              name={`transfer_${id}_driver_name`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ทะเบียนรถ
            </label>
            <input
              type="text"
              name={`transfer_${id}_license_plate`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคาต้นทุน
            </label>
            <input
              type="number"
              name={`transfer_${id}_cost_price`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคาขาย
            </label>
            <input
              type="number"
              name={`transfer_${id}_selling_price`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หมายเหตุ
            </label>
            <input
              type="text"
              name={`transfer_${id}_note`}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferForm;
