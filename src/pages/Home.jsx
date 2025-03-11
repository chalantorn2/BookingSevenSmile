import React from "react";
import { Link } from "react-router-dom";
import {
  PlusCircleIcon,
  DocumentTextIcon,
  QueueListIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import LogoImage from "../assets/Tour and Ticket 2.png";

const HomeCard = ({ to, icon, title, description, bgColor }) => (
  <Link
    to={to}
    className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 overflow-hidden"
  >
    <div
      className={`p-6 ${bgColor} bg-opacity-10 flex flex-col items-center text-center`}
    >
      <div
        className={`w-24 h-24 ${bgColor} bg-opacity-80 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
      >
        {React.createElement(icon, {
          className: "w-12 h-12 text-white",
        })}
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 text-sm ">{description}</p>
    </div>
  </Link>
);

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#87d0f7] to-[#f4f7b] bg-opacity-50">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <div className="mx-auto mb-6 w-24 h-24 flex items-center justify-center  overflow-hidden">
            <img
              src={LogoImage}
              alt="Seven Smile Booking Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-[#0a6da3] mb-4">
            Seven Smile Booking
          </h1>
          <p className="text-xl text-[#0a6da3] max-w-2xl mx-auto opacity-80">
            ระบบจัดการการจองทัวร์และบริการรถรับส่งอย่างมืออาชีพ
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <HomeCard
            to="/booking-form"
            icon={PlusCircleIcon}
            title="สร้างการจองใหม่"
            description="เพิ่ม Order และจองทัวร์หรือรถรับส่ง"
            bgColor="bg-[#0a6da3]"
          />
          <HomeCard
            to="/view-bookings"
            icon={DocumentTextIcon}
            title="รายการจอง"
            description="ดูและจัดการการจองทั้งหมด"
            bgColor="bg-[#f47f7b]"
          />
          <HomeCard
            to="/view-orders"
            icon={QueueListIcon}
            title="จัดการ Orders"
            description="ตรวจสอบและแก้ไข Order"
            bgColor="bg-[#87d0f7]"
          />
          <HomeCard
            to="/reports"
            icon={ChartBarIcon}
            title="รายงาน"
            description="วิเคราะห์และส่งออกข้อมูล"
            bgColor="bg-[#f47f7b]"
          />
        </div>

        <footer className="text-center mt-16 text-[#0a6da3]">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Seven Smile Booking -
            ระบบจัดการการจองอย่างมืออาชีพ
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
