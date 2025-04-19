// src/components/auth/PrivateRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const PrivateRoute = ({ requiredRole = null }) => {
  const { user, loading } = useAuth();

  // รอโหลดข้อมูลผู้ใช้
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // ถ้าไม่ได้ล็อกอิน ให้ redirect ไปที่หน้า login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ถ้าต้องการสิทธิ์เฉพาะแต่ไม่มีสิทธิ์
  if (requiredRole) {
    // ถ้าเป็น dev มีสิทธิ์เข้าถึงทุกหน้า
    if (user.role === "dev") {
      return <Outlet />;
    }

    // ถ้าต้องการสิทธิ์ admin แต่ผู้ใช้เป็น user
    if (requiredRole === "admin" && user.role === "user") {
      return <Navigate to="/" replace />;
    }
  }

  // ผ่านการตรวจสอบสิทธิ์
  return <Outlet />;
};

export default PrivateRoute;
