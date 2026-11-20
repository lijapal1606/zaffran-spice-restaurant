import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// API Base URL (using Vite proxy or direct backend server)
const API_BASE = '/api';
const BACKEND_FALLBACK = 'http://localhost:8000/api';

const LOCAL_STORAGE_KEY_TABLES = 'zaffran_tables_cache';
const LOCAL_STORAGE_KEY_RESERVATIONS = 'zaffran_reservations_cache';

// Initial Fallback Seed Data
const DEFAULT_TABLES = [
  { id: 1, table_number: 'T-1', capacity: 2, zone: 'Main Dining', status: 'available', current_guest: null },
  { id: 2, table_number: 'T-2', capacity: 4, zone: 'Main Dining', status: 'reserved', current_guest: 'Aarav Sharma', current_booking_time: '19:30:00' },
  { id: 3, table_number: 'T-3', capacity: 4, zone: 'Main Dining', status: 'occupied', current_guest: null },
  { id: 4, table_number: 'T-4', capacity: 6, zone: 'Main Dining', status: 'reserved', current_guest: 'Ananya Iyer', current_booking_time: '13:00:00' },
  { id: 5, table_number: 'T-5', capacity: 2, zone: 'Courtyard', status: 'reserved', current_guest: 'Priya Patel', current_booking_time: '20:00:00' },
  { id: 6, table_number: 'T-6', capacity: 4, zone: 'Courtyard', status: 'available', current_guest: null },
  { id: 7, table_number: 'T-7', capacity: 8, zone: 'Courtyard', status: 'available', current_guest: null },
  { id: 8, table_number: 'T-8', capacity: 6, zone: 'Royal Majlis', status: 'reserved', current_guest: 'Rohan Deshmukh', current_booking_time: '20:30:00' },
  { id: 9, table_number: 'T-9', capacity: 6, zone: 'Royal Majlis', status: 'available', current_guest: null },
  { id: 10, table_number: 'T-10', capacity: 8, zone: 'Royal Majlis', status: 'available', current_guest: null },
];

const DEFAULT_RESERVATIONS = [
  {
    id: 1,
    customer_name: 'Aarav Sharma',
    phone: '9876543210',
    email: 'aarav.sharma@example.com',
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '19:30:00',
    party_size: 4,
    special_requests: 'Window side, extra spicy appetizer request',
    table_id: 2,
    table_number: 'T-2',
    table_zone: 'Main Dining',
    status: 'confirmed',
  },
  {
    id: 2,
    customer_name: 'Priya Patel',
    phone: '9822011223',
    email: 'priya.patel@example.com',
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '20:00:00',
    party_size: 2,
    special_requests: 'Anniversary celebration & rose petal setup',
    table_id: 5,
    table_number: 'T-5',
    table_zone: 'Courtyard',
    status: 'confirmed',
  },
  {
    id: 3,
    customer_name: 'Rohan Deshmukh',
    phone: '9765432109',
    email: 'rohan.d@example.com',
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '20:30:00',
    party_size: 6,
    special_requests: 'Strict Jain food preparation (no onion/garlic)',
    table_id: 8,
    table_number: 'T-8',
    table_zone: 'Royal Majlis',
    status: 'confirmed',
  },
  {
    id: 4,
    customer_name: 'Ananya Iyer',
    phone: '9988776655',
    email: 'ananya.iyer@example.com',
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '13:00:00',
    party_size: 4,
    special_requests: 'Quiet corner table, high chair required for child',
    table_id: 4,
    table_number: 'T-4',
    table_zone: 'Main Dining',
    status: 'seated',
  },
];

// Initial State
const initialState = {
  tables: (() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_TABLES);
      return cached ? JSON.parse(cached) : DEFAULT_TABLES;
    } catch {
      return DEFAULT_TABLES;
    }
  })(),
  reservations: (() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_RESERVATIONS);
      return cached ? JSON.parse(cached) : DEFAULT_RESERVATIONS;
    } catch {
      return DEFAULT_RESERVATIONS;
    }
  })(),
  loading: false,
  error: null,
  toast: null,
  backendConnected: false,
};

// Reducer Function
function reservationReducer(state, action) {
  switch (action.type) {
    case 'SET_DATA': {
      const { tables, reservations, connected } = action.payload;
      return {
        ...state,
        tables: tables || state.tables,
        reservations: reservations || state.reservations,
        backendConnected: connected !== undefined ? connected : state.backendConnected,
        loading: false,
      };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SHOW_TOAST':
      return {
        ...state,
        toast: {
          id: Date.now(),
          message: action.payload.message,
          type: action.payload.type || 'success',
        },
      };

    case 'HIDE_TOAST':
      return { ...state, toast: null };

    case 'ADD_RESERVATION': {
      const newRes = action.payload;
      const updatedReservations = [newRes, ...state.reservations];

      // Update table status if assigned
      let updatedTables = state.tables;
      if (newRes.table_id) {
        updatedTables = state.tables.map(t =>
          t.id === newRes.table_id
            ? {
                ...t,
                status: newRes.status === 'seated' ? 'occupied' : 'reserved',
                current_guest: newRes.customer_name,
                current_booking_time: newRes.reservation_time,
              }
            : t
        );
      }

      localStorage.setItem(LOCAL_STORAGE_KEY_RESERVATIONS, JSON.stringify(updatedReservations));
      localStorage.setItem(LOCAL_STORAGE_KEY_TABLES, JSON.stringify(updatedTables));

      return {
        ...state,
        reservations: updatedReservations,
        tables: updatedTables,
      };
    }

    case 'UPDATE_RESERVATION': {
      const updatedRes = action.payload;
      const prevRes = state.reservations.find(r => r.id === updatedRes.id);

      const updatedReservations = state.reservations.map(r =>
        r.id === updatedRes.id ? { ...r, ...updatedRes } : r
      );

      // Adjust table statuses
      let updatedTables = [...state.tables];

      // If table changed, release old table
      if (prevRes && prevRes.table_id && prevRes.table_id !== updatedRes.table_id) {
        updatedTables = updatedTables.map(t =>
          t.id === prevRes.table_id ? { ...t, status: 'available', current_guest: null } : t
        );
      }

      // If status changed to completed or cancelled, release the table
      if (['completed', 'cancelled'].includes(updatedRes.status)) {
        const tableToFree = updatedRes.table_id || (prevRes ? prevRes.table_id : null);
        if (tableToFree) {
          updatedTables = updatedTables.map(t =>
            t.id === tableToFree ? { ...t, status: 'available', current_guest: null } : t
          );
        }
      } else if (updatedRes.table_id) {
        // Table is reserved or occupied
        const targetStatus = updatedRes.status === 'seated' ? 'occupied' : 'reserved';
        updatedTables = updatedTables.map(t =>
          t.id === updatedRes.table_id
            ? {
                ...t,
                status: targetStatus,
                current_guest: updatedRes.customer_name,
                current_booking_time: updatedRes.reservation_time,
              }
            : t
        );
      }

      localStorage.setItem(LOCAL_STORAGE_KEY_RESERVATIONS, JSON.stringify(updatedReservations));
      localStorage.setItem(LOCAL_STORAGE_KEY_TABLES, JSON.stringify(updatedTables));

      return {
        ...state,
        reservations: updatedReservations,
        tables: updatedTables,
      };
    }

    case 'DELETE_RESERVATION': {
      const resId = action.payload;
      const toDelete = state.reservations.find(r => r.id === resId);
      const updatedReservations = state.reservations.filter(r => r.id !== resId);

      let updatedTables = state.tables;
      if (toDelete && toDelete.table_id) {
        updatedTables = state.tables.map(t =>
          t.id === toDelete.table_id ? { ...t, status: 'available', current_guest: null } : t
        );
      }

      localStorage.setItem(LOCAL_STORAGE_KEY_RESERVATIONS, JSON.stringify(updatedReservations));
      localStorage.setItem(LOCAL_STORAGE_KEY_TABLES, JSON.stringify(updatedTables));

      return {
        ...state,
        reservations: updatedReservations,
        tables: updatedTables,
      };
    }

    case 'TOGGLE_TABLE_STATUS': {
      const { tableId, status } = action.payload;
      const updatedTables = state.tables.map(t =>
        t.id === tableId ? { ...t, status, current_guest: status === 'available' ? null : t.current_guest } : t
      );
      localStorage.setItem(LOCAL_STORAGE_KEY_TABLES, JSON.stringify(updatedTables));
      return { ...state, tables: updatedTables };
    }

    default:
      return state;
  }
}

// Context Creation
const ReservationContext = createContext();

export function ReservationProvider({ children }) {
  const [state, dispatch] = useReducer(reservationReducer, initialState);

  // Helper fetch with fallback URLs
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      if (res.ok) return await res.json();
      throw new Error(`HTTP ${res.status}`);
    } catch {
      // Try direct backend port 8000
      try {
        const fallbackRes = await fetch(`${BACKEND_FALLBACK}${endpoint}`, options);
        if (fallbackRes.ok) return await fallbackRes.json();
      } catch {
        // Network or server unreachable
      }
      return null;
    }
  }, []);

  // Sync data from PHP REST API on mount
  const refreshData = useCallback(async (showNotification = false) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [tablesRes, reservationsRes] = await Promise.all([
        apiFetch('/tables.php'),
        apiFetch('/reservations.php'),
      ]);

      if (tablesRes && tablesRes.success && reservationsRes && reservationsRes.success) {
        dispatch({
          type: 'SET_DATA',
          payload: {
            tables: tablesRes.data,
            reservations: reservationsRes.data,
            connected: true,
          },
        });
        localStorage.setItem(LOCAL_STORAGE_KEY_TABLES, JSON.stringify(tablesRes.data));
        localStorage.setItem(LOCAL_STORAGE_KEY_RESERVATIONS, JSON.stringify(reservationsRes.data));
        if (showNotification) {
          dispatch({
            type: 'SHOW_TOAST',
            payload: { message: 'Synced with Zaffran & Spice live server!', type: 'success' },
          });
        }
      } else {
        // Backend not currently reachable; keep cached data and note mode
        dispatch({
          type: 'SET_DATA',
          payload: { connected: false },
        });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiFetch]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Create new reservation
  const createReservation = async (reservationData) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    // 1. Try API Call
    try {
      const response = await apiFetch('/reservations.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      if (response && response.success) {
        dispatch({ type: 'ADD_RESERVATION', payload: response.data });
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            message: response.message || `Reservation confirmed for ${reservationData.customer_name}!`,
            type: 'success',
          },
        });
        await refreshData();
        return { success: true, data: response.data };
      } else if (response && response.message) {
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: response.message, type: 'error' },
        });
        return { success: false, message: response.message };
      }
    } catch {
      // Fallback to local state processing
    }

    // Local / Offline fallback logic
    const partySize = Number(reservationData.party_size);
    let assignedTable = null;

    if (reservationData.table_id) {
      assignedTable = state.tables.find(t => t.id === Number(reservationData.table_id));
      if (!assignedTable || assignedTable.capacity < partySize) {
        const msg = `Selected table cannot fit a party of ${partySize}.`;
        dispatch({ type: 'SHOW_TOAST', payload: { message: msg, type: 'error' } });
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, message: msg };
      }
    } else {
      // Auto-assign best-fitting available table
      const availableTables = state.tables
        .filter(t => t.status === 'available' && t.capacity >= partySize)
        .sort((a, b) => a.capacity - b.capacity);

      if (availableTables.length === 0) {
        const msg = `No available table fits a party of ${partySize}.`;
        dispatch({ type: 'SHOW_TOAST', payload: { message: msg, type: 'error' } });
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, message: msg };
      }
      assignedTable = availableTables[0];
    }

    const mockId = Date.now();
    const newReservation = {
      ...reservationData,
      id: mockId,
      party_size: partySize,
      table_id: assignedTable.id,
      table_number: assignedTable.table_number,
      table_zone: assignedTable.zone,
      status: reservationData.status || 'confirmed',
      created_at: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_RESERVATION', payload: newReservation });
    const successMsg = `Reservation confirmed for ${reservationData.customer_name} — Table ${assignedTable.table_number} assigned!`;
    dispatch({ type: 'SHOW_TOAST', payload: { message: successMsg, type: 'success' } });
    dispatch({ type: 'SET_LOADING', payload: false });

    return { success: true, data: newReservation };
  };

  // Update existing reservation
  const updateReservation = async (reservationData) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await apiFetch('/reservations.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      if (response && response.success) {
        dispatch({ type: 'UPDATE_RESERVATION', payload: response.data });
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: response.message, type: 'success' },
        });
        await refreshData();
        return { success: true };
      }
    } catch {
      // Handled by local fallback
    }

    // Local update fallback
    dispatch({ type: 'UPDATE_RESERVATION', payload: reservationData });
    dispatch({
      type: 'SHOW_TOAST',
      payload: { message: `Reservation #${reservationData.id} updated successfully.`, type: 'success' },
    });
    dispatch({ type: 'SET_LOADING', payload: false });
    return { success: true };
  };

  // Delete / Cancel reservation
  const deleteReservation = async (reservationId) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await apiFetch(`/reservations.php?id=${reservationId}`, {
        method: 'DELETE',
      });

      if (response && response.success) {
        dispatch({ type: 'DELETE_RESERVATION', payload: reservationId });
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: response.message, type: 'info' },
        });
        await refreshData();
        return { success: true };
      }
    } catch {
      // Local fallback
    }

    dispatch({ type: 'DELETE_RESERVATION', payload: reservationId });
    dispatch({
      type: 'SHOW_TOAST',
      payload: { message: `Reservation #${reservationId} cancelled and table released.`, type: 'info' },
    });
    dispatch({ type: 'SET_LOADING', payload: false });
    return { success: true };
  };

  // Toggle or Update Table Status
  const updateTableStatus = async (tableId, newStatus) => {
    try {
      const response = await apiFetch('/tables.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tableId, status: newStatus }),
      });

      if (response && response.success) {
        dispatch({ type: 'TOGGLE_TABLE_STATUS', payload: { tableId, status: newStatus } });
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: response.message, type: 'success' },
        });
        await refreshData();
        return { success: true };
      }
    } catch {
      // Fallback
    }

    dispatch({ type: 'TOGGLE_TABLE_STATUS', payload: { tableId, status: newStatus } });
    const targetTable = state.tables.find(t => t.id === tableId);
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: `Table ${targetTable ? targetTable.table_number : tableId} status changed to ${newStatus}.`,
        type: 'success',
      },
    });
    return { success: true };
  };

  // Hide toast helper
  const closeToast = () => dispatch({ type: 'HIDE_TOAST' });

  // Computed metrics
  const availableCount = state.tables.filter(t => t.status === 'available').length;
  const occupiedCount = state.tables.filter(t => t.status === 'occupied').length;
  const reservedCount = state.tables.filter(t => t.status === 'reserved').length;
  const expectedGuestsToday = state.reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + (Number(r.party_size) || 0), 0);

  const value = {
    ...state,
    availableCount,
    occupiedCount,
    reservedCount,
    expectedGuestsToday,
    createReservation,
    updateReservation,
    deleteReservation,
    updateTableStatus,
    refreshData,
    closeToast,
  };

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservations() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservations must be used within a ReservationProvider');
  }
  return context;
}
