// src/components/auth/UserForm.jsx
import React, { useState, useEffect } from "react";
import { X, Save, User, Lock } from "lucide-react";

const UserForm = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullname: "",
    role: "user",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ถ้ามีข้อมูลผู้ใช้ส่งมา (กรณีแก้ไข)
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        password: "",
        confirmPassword: "",
        fullname: user.fullname || "",
        role: user.role || "user",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // ล้าง error เมื่อผู้ใช้แก้ไข
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // ตรวจสอบชื่อผู้ใช้
    if (!formData.username.trim()) {
      newErrors.username = "กรุณากรอกชื่อผู้ใช้";
    } else if (formData.username.length < 3) {
      newErrors.username = "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร";
    }

    // ตรวจสอบรหัสผ่าน (ตรวจเฉพาะเมื่อเพิ่มใหม่หรือเมื่อกรอกรหัสผ่าน)
    if (!user || formData.password) {
      if (!user && !formData.password) {
        newErrors.password = "กรุณากรอกรหัสผ่าน";
      } else if (formData.password && formData.password.length < 6) {
        newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
      }
    }

    // ตรวจสอบชื่อ-นามสกุล
    if (!formData.fullname.trim()) {
      newErrors.fullname = "กรุณากรอกชื่อ-นามสกุล";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // สร้างข้อมูลที่จะส่งไป
      const userData = {
        username: formData.username,
        fullname: formData.fullname,
        role: formData.role,
      };

      // เพิ่มรหัสผ่านเฉพาะเมื่อมีการกรอก
      if (formData.password) {
        userData.password = formData.password;
      }

      await onSave(userData, user ? user.id : null);

      // รีเซ็ตฟอร์ม
      if (!user) {
        setFormData({
          username: "",
          password: "",
          confirmPassword: "",
          fullname: "",
          role: "user",
        });
      }
    } catch (error) {
      console.error("Error saving user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {user ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อผู้ใช้ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={user != null} // ไม่ให้แก้ไขชื่อผู้ใช้ถ้าเป็นการแก้ไข
                  className={`pl-10 w-full p-2 border rounded-md ${
                    errors.username
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  } focus:outline-none focus:ring-2 ${
                    user ? "bg-gray-100" : ""
                  }`}
                  placeholder="ชื่อผู้ใช้"
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-500">{errors.username}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {user ? "รหัสผ่านใหม่" : "รหัสผ่าน"}
                {!user && <span className="text-red-500"> *</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 w-full p-2 border rounded-md ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  } focus:outline-none focus:ring-2`}
                  placeholder={
                    user ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยน" : "รหัสผ่าน"
                  }
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่าน
                {!user && <span className="text-red-500"> *</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-500" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 w-full p-2 border rounded-md ${
                    errors.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  } focus:outline-none focus:ring-2`}
                  placeholder="ยืนยันรหัสผ่าน"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${
                  errors.fullname
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                } focus:outline-none focus:ring-2`}
                placeholder="ชื่อ-นามสกุล"
              />
              {errors.fullname && (
                <p className="mt-1 text-xs text-red-500">{errors.fullname}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ระดับสิทธิ์ <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="dev">Developer</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" /> บันทึก
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
