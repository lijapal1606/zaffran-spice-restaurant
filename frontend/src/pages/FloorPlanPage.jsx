import React from 'react';
import TableFloorPlan from '../components/TableFloorPlan';
import { useReservations } from '../context/ReservationContext';

export default function FloorPlanPage() {
  const { tables, availableCount, occupiedCount, reservedCount } = useReservations();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E293B, #0F172A)',
          color: '#FFFFFF',
          padding: '1.75rem 2rem',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, color: '#FEF08A' }}>
            Interactive Dining Floor Architecture
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '4px' }}>
            Live status of all 10 dining tables across Main Dining, Courtyard Veranda, and Royal Majlis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#334155', padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>{availableCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Free Tables</div>
          </div>
          <div style={{ background: '#334155', padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F43F5E' }}>{occupiedCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Occupied</div>
          </div>
          <div style={{ background: '#334155', padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B' }}>{reservedCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Reserved</div>
          </div>
        </div>
      </div>

      {/* Interactive Table Floor Component */}
      <TableFloorPlan />
    </div>
  );
}
