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

  // src/components/common/forms/OrderSelector.jsx
  // แก้ไขส่วน fetchOrders function
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

      // ดึงข้อมูล orders พื้นฐาน
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // ในกรณีที่มีข้อมูลมาก อาจดึงเฉพาะ orders ล่าสุด เช่น 50 รายการ
      const recentOrders = data.slice(0, 50);

      // สร้าง array สำหรับเก็บ promises ของการนับ bookings
      const countPromises = recentOrders.map((order) => {
        return Promise.all([
          // นับจำนวน tour bookings
          supabase
            .from("tour_bookings")
            .select("id", { count: "exact" })
            .eq("order_id", order.id)
            .then(({ count, error }) => (error ? 0 : count)),

          // นับจำนวน transfer bookings
          supabase
            .from("transfer_bookings")
            .select("id", { count: "exact" })
            .eq("order_id", order.id)
            .then(({ count, error }) => (error ? 0 : count)),
        ]);
      });

      // รอให้ทุก promise ทำงานเสร็จ
      const countResults = await Promise.all(countPromises);

      // สร้าง array ข้อมูลสำหรับ dropdown
      const formattedOrders = recentOrders.map((order, index) => {
        const [tourCount, transferCount] = countResults[index];
        const refId = order.reference_id || `Order #${order.id}`;
        const customerName = `${order.first_name || ""} ${
          order.last_name || ""
        }`.trim();

        let label = refId;
        if (customerName) {
          label = `${customerName} - ${refId}`;
        }

        if (tourCount > 0 || transferCount > 0) {
          label += ` (${tourCount} ทัวร์, ${transferCount} รถรับส่ง)`;
        }

        return {
          value: order.id,
          label: label,
          orderId: order.reference_id,
          tourCount: tourCount,
          transferCount: transferCount,
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
  // แก้ไขส่วน handleOrderChange
  const handleOrderChange = (selectedOption) => {
    if (selectedOption) {
      onOrderSelect(selectedOption.value, selectedOption.orderId, {
        tourCount: selectedOption.tourCount || 0,
        transferCount: selectedOption.transferCount || 0,
      });
    } else {
      onOrderSelect(null, null, null);
    }
  };

  return (
    <div className="mb-8">
      <div className="text-center mb-4">
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
