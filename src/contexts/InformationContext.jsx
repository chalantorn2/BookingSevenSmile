// src/contexts/InformationContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  fetchInformationByCategory,
  addInformation,
} from "../services/informationService";

// สร้าง Context
const InformationContext = createContext();

// Hook สำหรับใช้งาน Context
export const useInformation = () => {
  return useContext(InformationContext);
};

// Provider Component
export const InformationProvider = ({ children }) => {
  // สถานะสำหรับเก็บข้อมูลต่างๆ
  const [tourTypes, setTourTypes] = useState([]);
  const [tourRecipients, setTourRecipients] = useState([]);
  const [transferTypes, setTransferTypes] = useState([]);
  const [transferRecipients, setTransferRecipients] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [dropLocations, setDropLocations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลทั้งหมดเมื่อ component ถูกโหลด
  useEffect(() => {
    loadAllInformation();
  }, []);

  // ฟังก์ชันโหลดข้อมูลทั้งหมด
  const loadAllInformation = async () => {
    setLoading(true);
    try {
      const categories = [
        { category: "agent", setter: setAgents },
        { category: "tour_type", setter: setTourTypes },
        { category: "tour_recipient", setter: setTourRecipients },
        { category: "transfer_type", setter: setTransferTypes },
        { category: "transfer_recipient", setter: setTransferRecipients },
        { category: "hotel", setter: setHotels },
        { category: "pickup_location", setter: setPickupLocations },
        { category: "drop_location", setter: setDropLocations },
      ];

      // ดึงข้อมูลทุกประเภทแบบขนาน
      await Promise.all(
        categories.map(async ({ category, setter }) => {
          const { data } = await fetchInformationByCategory(category);
          if (data) {
            setter(data);
          }
        })
      );
    } catch (error) {
      console.error("Error loading information:", error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเพิ่มข้อมูลใหม่
  const addNewInformation = async (category, value, description = "") => {
    try {
      const { data, error } = await addInformation({
        category,
        value: value.trim(),
        description,
        active: true,
      });

      if (error) throw error;
      if (!data) throw new Error("Failed to add new information");

      // อัปเดตสถานะตามหมวดหมู่
      switch (category) {
        case "agent":
          setAgents((prev) => [...prev, data]);
          break;
        case "tour_type":
          setTourTypes((prev) => [...prev, data]);
          break;
        case "tour_recipient":
          setTourRecipients((prev) => [...prev, data]);
          break;
        case "transfer_type":
          setTransferTypes((prev) => [...prev, data]);
          break;
        case "transfer_recipient":
          setTransferRecipients((prev) => [...prev, data]);
          break;
        case "hotel":
          setHotels((prev) => [...prev, data]);
          break;
        case "pickup_location":
          setPickupLocations((prev) => [...prev, data]);
          break;
        case "drop_location":
          setDropLocations((prev) => [...prev, data]);
          break;
        default:
          break;
      }

      return data;
    } catch (error) {
      console.error(`Error adding ${category} information:`, error);
      return null;
    }
  };

  // ค่าที่จะส่งไปยัง Context
  const value = {
    // ข้อมูล
    tourTypes,
    tourRecipients,
    transferTypes,
    transferRecipients,
    hotels,
    pickupLocations,
    dropLocations,
    agents,
    loading,

    // ฟังก์ชัน
    addNewInformation,
    refreshInformation: loadAllInformation,
  };

  return (
    <InformationContext.Provider value={value}>
      {children}
    </InformationContext.Provider>
  );
};

export default InformationContext;
