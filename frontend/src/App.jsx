import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import ReservationsPage from './pages/ReservationsPage';
import FloorPlanPage from './pages/FloorPlanPage';
import NewReservationPage from './pages/NewReservationPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/tables" element={<FloorPlanPage />} />
            <Route path="/new-reservation" element={<NewReservationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <Toast />
      </div>
    </BrowserRouter>
  );
}
