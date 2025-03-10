import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <header className="text-center my-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Seven Smile Booking System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            ระบบจองทัวร์และบริการรถรับส่ง
          </p>
        </header>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/booking-form"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              สร้างการจองใหม่
            </h2>
            <p className="text-gray-600">
              สร้าง Order และเพิ่มการจองทัวร์หรือรถรับส่ง
            </p>
          </Link>

          <Link
            to="/view-bookings"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              ดูรายการจอง
            </h2>
            <p className="text-gray-600">เรียกดูและจัดการรายการจองทั้งหมด</p>
          </Link>

          <Link
            to="/view-orders"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              จัดการ Orders
            </h2>
            <p className="text-gray-600">ดูและแก้ไขข้อมูล Orders ทั้งหมด</p>
          </Link>

          <Link
            to="/reports"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v6a1 1 0 102 0V8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">รายงาน</h2>
            <p className="text-gray-600">ส่งออกข้อมูลและดูรายงานสรุป</p>
          </Link>
        </div>

        <footer className="text-center mt-12 mb-4 text-gray-600">
          <p>&copy; {new Date().getFullYear()} Seven Smile Booking System</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
