// app.js - Application Startup File for HostAtom
// This file serves as the entry point for the SevenSmile Tour & Ticket booking system

import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Import main components
import Home from "./src/pages/Home";
import BookingForm from "./src/pages/BookingForm";
import Information from "./src/pages/Information";
import Layout from "./src/components/common/Layout";
import ViewOrders from "./src/pages/ViewOrders";
import Payment from "./src/pages/Payment";
import Invoice from "./src/pages/Invoice";
import Voucher from "./src/pages/Voucher";
import CreateVoucher from "./src/pages/CreateVoucher";
import Report from "./src/pages/Report";
import Login from "./src/pages/Login";
import UserManagement from "./src/pages/UserManagement";
import ViewPayment from "./src/pages/ViewPayment";
import NotFound from "./src/pages/NotFound";

// Import contexts and providers
import { InformationProvider } from "./src/contexts/InformationContext";
import { AuthProvider } from "./src/contexts/AuthContext";
import { AlertDialogProvider } from "./src/contexts/AlertDialogContext";
import PrivateRoute from "./src/components/auth/PrivateRoute";

// Import third-party providers
import { SnackbarProvider } from "notistack";

// Import global styles
import "./src/index.css";

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <InformationProvider>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          autoHideDuration={3000}
        >
          <AlertDialogProvider>
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
                    <Route path="/voucher" element={<Voucher />} />
                    <Route path="/report" element={<Report />} />

                    {/* Route สำหรับสร้าง Voucher */}
                    <Route
                      path="/create-voucher/:bookingType/:bookingId"
                      element={<CreateVoucher />}
                    />

                    {/* Admin Routes - เฉพาะ admin และ dev เท่านั้น */}
                    <Route element={<PrivateRoute requiredRole="admin" />}>
                      <Route path="/users" element={<UserManagement />} />
                    </Route>

                    {/* Under Development Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <div className="container mx-auto p-8">
                          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                          <p className="text-gray-600">
                            Dashboard page - Under Development
                          </p>
                        </div>
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <div className="container mx-auto p-8">
                          <h1 className="text-2xl font-bold mb-4">Reports</h1>
                          <p className="text-gray-600">
                            Report Page - Under Development
                          </p>
                        </div>
                      }
                    />
                  </Route>

                  {/* 404 Page - แสดงสำหรับทุก path ที่ไม่ตรงกับเส้นทางที่กำหนด */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </Router>
          </AlertDialogProvider>
        </SnackbarProvider>
      </InformationProvider>
    </AuthProvider>
  );
};

// Initialize the React application
const initializeApp = () => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error(
      "Root element not found! Make sure there's a div with id='root' in your HTML file."
    );
    return;
  }

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// Global error handling
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Export the App component for potential use
export default App;
