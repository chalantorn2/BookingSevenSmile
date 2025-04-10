// src/contexts/InformationContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  fetchInformationByCategory,
  addInformation,
} from "../services/informationService";

// สร้าง Context พร้อมค่าเริ่มต้น
const InformationContext = createContext({
  tourTypes: [],
  tourRecipients: [],
  transferTypes: [],
  transferRecipients: [],
  places: [], // เหลือแค่ places อย่างเดียว
  agents: [],
  loading: true,
  addNewInformation: () => {},
  refreshInformation: () => {},
});

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
  const [places, setPlaces] = useState([]);
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
        { category: "place", setter: setPlaces }, // เพิ่ม place ในรายการหลัก
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

      // ลบส่วนการดึงข้อมูล legacyCategories ทั้งหมด
    } catch (error) {
      console.error("Error loading information:", error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเพิ่มข้อมูลใหม่
  const addNewInformation = async (category, value, description = "") => {
    try {
      // แปลงหมวดหมู่เก่าให้เป็น "place"
      const actualCategory =
        category === "hotel" ||
        category === "pickup_location" ||
        category === "drop_location"
          ? "place"
          : category;

      const { data, error } = await addInformation({
        category: actualCategory,
        value: value.trim(),
        description,
        active: true,
      });

      if (error) throw error;
      if (!data) throw new Error("Failed to add new information");

      // อัปเดตสถานะตามหมวดหมู่
      switch (actualCategory) {
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
        case "place":
          setPlaces((prev) => [...prev, data]);
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

  // แปลงข้อมูลจาก API เป็น options สำหรับ AutocompleteInput
  const formatOptions = (items) => {
    if (!Array.isArray(items)) return [];

    // เพิ่ม console.log เพื่อตรวจสอบข้อมูลที่นำเข้า
    console.log("Formatting items:", items);

    return items.map((item) => ({
      id: item.id,
      value: item.value || "",
      description: item.description || "",
    }));
  };

  const value = {
    // ข้อมูล
    tourTypes: formatOptions(tourTypes),
    tourRecipients: formatOptions(tourRecipients),
    transferTypes: formatOptions(transferTypes),
    transferRecipients: formatOptions(transferRecipients),
    places: formatOptions(places), // เหลือแค่ places อย่างเดียว
    agents: formatOptions(agents),
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
