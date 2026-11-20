import React, { useEffect } from 'react';
import { useReservations } from '../context/ReservationContext';

const toastStyles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '420px',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    borderRadius: '10px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1E293B',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    animation: 'slideUp 0.25s ease-out',
  },
  icon: {
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  successBorder: {
    borderLeft: '5px solid #10B981',
  },
  errorBorder: {
    borderLeft: '5px solid #EF4444',
  },
  infoBorder: {
    borderLeft: '5px solid #3B82F6',
  },
  closeBtn: {
    marginLeft: 'auto',
    cursor: 'pointer',
    color: '#94A3B8',
    background: 'transparent',
    border: 'none',
    fontSize: '1rem',
    lineHeight: 1,
    padding: '4px',
  },
};

export default function Toast() {
  const { toast, closeToast } = useReservations();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        closeToast();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast, closeToast]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div style={toastStyles.container}>
      <div
        style={{
          ...toastStyles.toast,
          ...(isSuccess ? toastStyles.successBorder : isError ? toastStyles.errorBorder : toastStyles.infoBorder),
        }}
      >
        <span style={toastStyles.icon}>{isSuccess ? '✅' : isError ? '⚠️' : 'ℹ️'}</span>
        <div style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</div>
        <button style={toastStyles.closeBtn} onClick={closeToast} title="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
