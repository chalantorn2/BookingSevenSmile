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

  // แทนที่จะแยกเป็น 3 state เราใช้ places state เดียว
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
        // โหลดข้อมูลสถานที่ทั้งหมดเข้า places
        { category: "place", setter: setPlaces },
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

      // ดึงข้อมูลจากหมวดหมู่เก่า (hotel, pickup_location, drop_location)
      // และเพิ่มเข้าไปใน places (ช่วงเปลี่ยนผ่าน)
      const legacyCategories = ["hotel", "pickup_location", "drop_location"];
      const legacyPlaces = [];

      await Promise.all(
        legacyCategories.map(async (category) => {
          const { data } = await fetchInformationByCategory(category);
          if (data && data.length > 0) {
            legacyPlaces.push(...data);
          }
        })
      );

      // รวมและขจัดข้อมูลซ้ำ
      if (legacyPlaces.length > 0) {
        // อาจมีข้อมูลซ้ำกัน ให้ใช้ Set เพื่อกรองค่าที่ซ้ำกัน (ตามชื่อ value)
        const uniqueValues = new Set();
        const uniquePlaces = [];

        [...places, ...legacyPlaces].forEach((place) => {
          if (!uniqueValues.has(place.value)) {
            uniqueValues.add(place.value);
            uniquePlaces.push(place);
          }
        });

        setPlaces(uniquePlaces);
      }
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

  // ค่าที่จะส่งไปยัง Context
  const value = {
    // ข้อมูล
    tourTypes,
    tourRecipients,
    transferTypes,
    transferRecipients,
    places,
    // อ้างอิงจากข้อมูลเดิมมาหาข้อมูลใหม่ (เพื่อความเข้ากันได้กับโค้ดเดิม)
    hotels: places,
    pickupLocations: places,
    dropLocations: places,
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
