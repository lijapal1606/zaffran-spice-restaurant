import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ReservationProvider } from './context/ReservationContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReservationProvider>
      <App />
    </ReservationProvider>
  </React.StrictMode>
);
