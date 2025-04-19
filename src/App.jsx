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
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/booking-form" element={<BookingForm />} />
                <Route path="/orders" element={<ViewOrders />} />
                <Route path="/payments" element={<Payment />} />
                <Route path="/invoice" element={<Invoice />} />
                <Route path="/information" element={<Information />} />

                {/* Admin Routes */}
                <Route element={<PrivateRoute requiredRole="admin" />}>
                  <Route path="/users" element={<UserManagement />} />
                </Route>

                {/* Under Development */}
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

              {/* Not Found Route */}
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
    </AuthProvider>
  );
};

export default App;
