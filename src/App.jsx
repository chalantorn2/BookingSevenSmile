// ในไฟล์ App.jsx เพิ่มการ import CSS สำหรับ Invoice
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BookingForm from "./pages/BookingForm";
import Information from "./pages/Information";
import Layout from "./components/common/Layout";
import { InformationProvider } from "./contexts/InformationContext";
import ViewOrders from "./pages/ViewOrders";
import Payment from "./pages/Payment";
import Invoice from "./pages/Invoice";
import "./styles/invoice.css"; // เพิ่มบรรทัดนี้

const App = () => {
  return (
    <InformationProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/booking-form" element={<BookingForm />} />
            <Route path="/information" element={<Information />} />
            <Route path="/orders" element={<ViewOrders />} />
            <Route path="/payments" element={<Payment />} />
            <Route path="/invoice" element={<Invoice />} />
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
            <Route
              path="*"
              element={
                <div className="container mx-auto p-8 text-center">
                  <h1 className="text-2xl font-bold mb-4">
                    404 - Page Not Found
                  </h1>
                  <p>The page you are looking for does not exist.</p>
                </div>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </InformationProvider>
  );
};

export default App;
