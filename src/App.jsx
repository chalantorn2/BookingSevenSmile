// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import BookingForm from "./pages/BookingForm";
import Information from "./pages/Information";
import Layout from "./components/common/Layout";
import { InformationProvider } from "./contexts/InformationContext";
import ViewOrders from "./pages/ViewOrders";
import Payment from "./pages/Payment";
import Invoice from "./pages/Invoice";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";
import ViewPayment from "./pages/ViewPayment";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/auth/PrivateRoute";
import "./styles/invoice.css";

const App = () => {
  return (
    <AuthProvider>
      <InformationProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes - ทางเข้าที่ไม่ต้องล็อกอิน */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes - ต้องล็อกอินเท่านั้น */}
              <Route element={<PrivateRoute />}>
                {/* หน้าทั่วไปที่ทุกระดับสิทธิ์เข้าถึงได้ */}
                <Route path="/" element={<Home />} />
                <Route path="/booking-form" element={<BookingForm />} />
                <Route path="/orders" element={<ViewOrders />} />
                <Route path="/payments" element={<Payment />} />
                <Route path="/invoice" element={<Invoice />} />
                <Route path="/information" element={<Information />} />
                <Route path="/view-payment" element={<ViewPayment />} />

                {/* Admin Routes - เฉพาะ admin และ dev เท่านั้น */}
                <Route element={<PrivateRoute requiredRole="admin" />}>
                  <Route path="/users" element={<UserManagement />} />
                </Route>

                {/* Under Development - อยู่ระหว่างพัฒนา */}
                <Route
                  path="/dashboard"
                  element={
                    <div className="container mx-auto p-8">
                      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                      <p>Dashboard page - Under Development</p>
                    </div>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <div className="container mx-auto p-8">
                      <h1 className="text-2xl font-bold mb-4">Reports</h1>
                      <p>Report Page - Under Development</p>
                    </div>
                  }
                />
              </Route>

              {/* Default - redirect to login หากไม่พบเส้นทาง */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Layout>
        </Router>
      </InformationProvider>
    </AuthProvider>
  );
};

export default App;
