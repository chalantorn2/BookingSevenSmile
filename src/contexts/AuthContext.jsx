// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import supabase from "../config/supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลผู้ใช้จาก localStorage เมื่อโหลดครั้งแรก
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ฟังก์ชัน login
  const login = async (username, password) => {
    try {
      setLoading(true);
      // ค้นหาผู้ใช้ด้วย username และ password
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("active", true)
        .single();

      if (error) throw error;
      if (!data) throw new Error("ไม่พบชื่อผู้ใช้");

      // ตรวจสอบรหัสผ่าน (ใช้ bcrypt ใน production)
      // ในตัวอย่างนี้เราเก็บ hash ไว้ในฐานข้อมูลแล้ว
      const { data: passwordValid, error: pwdError } = await supabase.rpc(
        "verify_password",
        {
          password_input: password,
          password_hash: data.password_hash,
        }
      );

      if (pwdError) throw pwdError;
      if (!passwordValid) throw new Error("รหัสผ่านไม่ถูกต้อง");

      // สร้างออบเจ็คผู้ใช้ไม่รวมรหัสผ่าน
      const userData = {
        id: data.id,
        username: data.username,
        fullname: data.fullname,
        role: data.role,
      };

      // บันทึกข้อมูลลง localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชัน logout
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // ฟังก์ชันตรวจสอบสิทธิ์
  const checkPermission = (requiredRole) => {
    if (!user) return false;

    // ถ้าเป็น Dev สามารถเข้าถึงได้ทุกส่วน
    if (user.role === "dev") return true;

    // ถ้าต้องการสิทธิ์ Admin แต่เป็น User ให้กลับ false
    if (requiredRole === "admin" && user.role === "user") return false;

    // กรณีอื่นๆ (Admin เข้าถึงได้หมด หรือ User เข้าถึงหน้า User)
    return true;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
