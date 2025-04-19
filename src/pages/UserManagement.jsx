// src/pages/UserManagement.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
} from "../services/authService";
import UserForm from "../components/auth/UserForm";
import {
  Plus,
  RefreshCcw,
  Edit,
  Trash2,
  Key,
  Search,
  AlertCircle,
  User,
  Shield,
} from "lucide-react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showUserForm, setShowUserForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { user: currentLoggedUser } = useAuth();

  // โหลดข้อมูลผู้ใช้ทั้งหมด
  useEffect(() => {
    loadUsers();
  }, []);

  // กรองผู้ใช้เมื่อมีการค้นหา
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchTerm]);

  // โหลดข้อมูลผู้ใช้จาก API
  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await fetchAllUsers();
      if (error) {
        throw new Error(error);
      }

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  // บันทึกข้อมูลผู้ใช้ (เพิ่ม/แก้ไข)
  const handleSaveUser = async (userData, userId = null) => {
    setLoading(true);
    setError(null);

    try {
      let result;

      if (userId) {
        // แก้ไขผู้ใช้
        result = await updateUser(userId, userData);

        // ถ้ามีการส่งรหัสผ่านมา
        if (userData.password) {
          const pwdResult = await changePassword(userId, userData.password);
          if (!pwdResult.success) {
            throw new Error(pwdResult.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
          }
        }
      } else {
        // เพิ่มผู้ใช้ใหม่
        result = await createUser(userData);
      }

      if (!result.success) {
        throw new Error(result.error || "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้");
      }

      // โหลดข้อมูลผู้ใช้อีกครั้ง
      await loadUsers();

      // ปิดฟอร์ม
      setShowUserForm(false);
      setCurrentUser(null);

      alert(userId ? "อัปเดตผู้ใช้เรียบร้อย" : "เพิ่มผู้ใช้ใหม่เรียบร้อย");
    } catch (err) {
      console.error("Error saving user:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // เปลี่ยนรหัสผ่าน
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordUser) return;

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await changePassword(passwordUser.id, newPassword);

      if (!result.success) {
        throw new Error(result.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
      }

      // รีเซ็ตค่าและปิด modal
      setNewPassword("");
      setConfirmPassword("");
      setPasswordUser(null);
      setShowPasswordModal(false);

      alert("เปลี่ยนรหัสผ่านเรียบร้อย");
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setLoading(false);
    }
  };

  // ลบผู้ใช้
  const handleDeleteUser = async (user) => {
    // ตรวจสอบสิทธิ์
    if (currentLoggedUser.role !== "dev" && user.role === "admin") {
      alert("คุณไม่มีสิทธิ์ลบผู้ใช้ระดับ Admin");
      return;
    }

    // ไม่ให้ลบตัวเอง
    if (user.id === currentLoggedUser.id) {
      alert("คุณไม่สามารถลบบัญชีของตัวเองได้");
      return;
    }

    if (!window.confirm(`คุณต้องการลบผู้ใช้ ${user.username} ใช่หรือไม่?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deleteUser(user.id);

      if (!result.success) {
        throw new Error(result.error || "ไม่สามารถลบผู้ใช้ได้");
      }

      // โหลดข้อมูลผู้ใช้อีกครั้ง
      await loadUsers();

      alert("ลบผู้ใช้เรียบร้อย");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการลบผู้ใช้");
    } finally {
      setLoading(false);
    }
  };

  // สามารถจัดการ (แก้ไข/ลบ) ผู้ใช้หรือไม่
  const canManageUser = (targetUser) => {
    // ถ้าเป็น developer สามารถจัดการได้ทุกคน ยกเว้นตัวเอง (สำหรับการลบ)
    if (currentLoggedUser.role === "dev") {
      return true;
    }

    // ถ้าเป็น admin สามารถจัดการได้เฉพาะ user
    if (currentLoggedUser.role === "admin" && targetUser.role === "user") {
      return true;
    }

    // นอกจากนั้นจัดการไม่ได้
    return false;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
        <p className="text-gray-600">เพิ่ม แก้ไข และลบผู้ใช้งานในระบบ</p>
      </div>

      {/* ปุ่มดำเนินการ */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button
          className="btn btn-primary flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          onClick={() => {
            setCurrentUser(null);
            setShowUserForm(true);
          }}
        >
          <Plus size={18} />
          เพิ่มผู้ใช้ใหม่
        </button>
        <button
          className="btn btn-success flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          onClick={loadUsers}
        >
          <RefreshCcw size={18} />
          โหลดข้อมูลใหม่
        </button>
      </div>

      {/* การค้นหา */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาผู้ใช้..."
            className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* แสดงข้อผิดพลาด */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* แสดงตารางผู้ใช้ */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ชื่อผู้ใช้
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ชื่อ-นามสกุล
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ระดับสิทธิ์
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  สถานะ
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && !filteredUsers.length ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 whitespace-nowrap text-center"
                  >
                    <div className="flex justify-center items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
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
                      <span>กำลังโหลด...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 whitespace-nowrap text-center text-gray-500"
                  >
                    ไม่พบข้อมูลผู้ใช้
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User size={18} className="mr-2 text-gray-400" />
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.fullname || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield
                          size={18}
                          className={`mr-2 ${
                            user.role === "dev"
                              ? "text-purple-500"
                              : user.role === "admin"
                              ? "text-red-500"
                              : "text-blue-500"
                          }`}
                        />
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "dev"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role === "dev"
                            ? "Developer"
                            : user.role === "admin"
                            ? "Admin"
                            : "User"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.active !== false
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.active !== false ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setCurrentUser(user);
                            setShowUserForm(true);
                          }}
                          disabled={!canManageUser(user)}
                          className={`text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 ${
                            !canManageUser(user)
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          title="แก้ไขข้อมูลและรหัสผ่าน"
                        >
                          <Edit size={18} />
                        </button>
                        {/* ลบปุ่ม Key ออก เนื่องจากซ้ำซ้อนกับฟังก์ชันในปุ่ม Edit */}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={
                            !canManageUser(user) ||
                            user.id === currentLoggedUser.id
                          }
                          className={`text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 ${
                            !canManageUser(user) ||
                            user.id === currentLoggedUser.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          title="ลบผู้ใช้"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UserForm Modal */}
      {showUserForm && (
        <UserForm
          user={currentUser}
          onSave={handleSaveUser}
          onClose={() => {
            setShowUserForm(false);
            setCurrentUser(null);
          }}
        />
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                เปลี่ยนรหัสผ่าน
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordUser(null);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ผู้ใช้
                </label>
                <input
                  type="text"
                  value={passwordUser?.username || ""}
                  className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md"
                  disabled
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="รหัสผ่านใหม่"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordUser(null);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
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
                      <Key size={16} className="mr-2" /> เปลี่ยนรหัสผ่าน
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
