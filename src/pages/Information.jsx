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
  const [places, setPlaces] = useState([]); // เพิ่มสำหรับการใช้งานใหม่
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
        { category: "place", setter: setPlaces }, // หมวดหมู่ใหม่ที่รวมสถานที่ต่างๆ
      ];

      // ดึงข้อมูลทุกประเภทแบบขนาน
      await Promise.all(
        categories.map(async ({ category, setter }) => {
          try {
            const { data, error } = await fetchInformationByCategory(category);
            if (error) {
              console.warn(`Warning loading ${category}:`, error);
              setter([]); // กรณีเกิด error ให้ตั้งค่าเป็น array ว่าง
            } else if (data) {
              setter(data);
            } else {
              setter([]);
            }
          } catch (err) {
            console.error(`Error loading ${category}:`, err);
            setter([]);
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
    if (!value || !value.trim()) {
      console.error("Cannot add empty value");
      return null;
    }

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

    return items.map((item) => ({
      id: item.id,
      value: item.value || "",
      description: item.description || "",
    }));
  };

  // ค่าที่จะส่งไปยัง Context
  const value = {
    // ข้อมูล
    tourTypes: formatOptions(tourTypes),
    tourRecipients: formatOptions(tourRecipients),
    transferTypes: formatOptions(transferTypes),
    transferRecipients: formatOptions(transferRecipients),
    hotels: formatOptions(hotels),
    pickupLocations: formatOptions(pickupLocations),
    dropLocations: formatOptions(dropLocations),
    places: formatOptions(places),
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
