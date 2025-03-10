import React, { useState, useEffect } from "react";
import supabase from "../../config/supabaseClient";
import Select from "react-select";

const OrderSelector = ({ onOrderSelect, onCreateNewOrder }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("กำลังดึงข้อมูล orders...");

      // ทดสอบการเชื่อมต่อ Supabase
      const { error: connectionError } = await supabase
        .from("orders")
        .select("count", { count: "exact" });
      if (connectionError) {
        console.error("ไม่สามารถเชื่อมต่อกับ Supabase:", connectionError);
        throw connectionError;
      }
      const { data, error } = await supabase.from("orders").select("*");

      if (error) throw error;

      console.log("ดึงข้อมูลสำเร็จ:", data);

      // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสมสำหรับ Select component
      const formattedOrders = data.map((order) => {
        // หาชื่อลูกค้าจาก booking แรกที่พบ (ไม่ว่าจะเป็น tour หรือ transfer)
        let firstName = "",
          lastName = "";

        if (order.tour_bookings && order.tour_bookings.length > 0) {
          firstName = order.tour_bookings[0].first_name;
          lastName = order.tour_bookings[0].last_name;
        } else if (
          order.transfer_bookings &&
          order.transfer_bookings.length > 0
        ) {
          firstName = order.transfer_bookings[0].first_name;
          lastName = order.transfer_bookings[0].last_name;
        }

        const label =
          firstName || lastName
            ? `${firstName} ${lastName} (${order.order_id})`
            : order.order_id;

        return {
          value: order.id,
          label: label,
          orderId: order.order_id,
        };
      });

      setOrders(formattedOrders);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("ไม่สามารถโหลดข้อมูล Order ได้");
      setIsLoading(false);
    }
  };

  const handleOrderChange = (selectedOption) => {
    if (selectedOption) {
      onOrderSelect(selectedOption.value, selectedOption.orderId);
    } else {
      onOrderSelect(null, null);
    }
  };

  return (
    <div className="mb-8">
      <div className="text-center mb-4">
        <label htmlFor="orderSelect" className="block text-lg font-bold mb-2">
          เลือก Order
        </label>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="w-full md:w-1/2">
            <Select
              id="orderSelect"
              options={orders}
              isLoading={isLoading}
              isClearable
              placeholder="เลือก Order..."
              onChange={handleOrderChange}
              className="text-left"
              classNamePrefix="select"
              noOptionsMessage={() => "ไม่พบข้อมูล Order"}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <button
            type="button"
            onClick={onCreateNewOrder}
            className="w-full md:w-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
          >
            สร้าง Order ใหม่
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSelector;
