import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BookingForm from "./pages/BookingForm";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking-form" element={<BookingForm />} />
        <Route
          path="/view-bookings"
          element={
            <div className="container mx-auto p-8 text-center">
              View Bookings Page - Under Development
            </div>
          }
        />
        <Route
          path="/view-orders"
          element={
            <div className="container mx-auto p-8 text-center">
              View Orders Page - Under Development
            </div>
          }
        />
        <Route
          path="/reports"
          element={
            <div className="container mx-auto p-8 text-center">
              Reports Page - Under Development
            </div>
          }
        />
        <Route
          path="*"
          element={
            <div className="container mx-auto p-8 text-center">
              Page Not Found
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
