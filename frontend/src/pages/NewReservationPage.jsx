import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationForm from '../components/ReservationForm';

export default function NewReservationPage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Experience Intro Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)',
          border: '1px solid #FED7AA',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Royal Indian Culinary Journey
          </span>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, color: '#7C2D12', marginTop: '4px' }}>
            Table Reservation at Zaffran &amp; Spice
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#9A3412', marginTop: '6px', maxWidth: '580px', lineHeight: 1.5 }}>
            Immerse your senses in slow-cooked Awadhi dum biryanis, coastal seafood curries, and tandoori delicacies. Select your preferred dining zone and special requirements below.
          </p>
        </div>
        <div style={{ fontSize: '3rem' }}>🍛✨</div>
      </div>

      {/* Booking Form */}
      <ReservationForm onFinished={() => navigate('/reservations')} compact={false} />

      {/* Dining Policy / Information Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>⏱️</div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>15-Minute Grace Window</div>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5 }}>
            Tables are held for up to 15 minutes past the reserved time slot before being released to walk-in patrons.
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🌱</div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Dietary &amp; Jain Friendly</div>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5 }}>
            Dedicated vegetarian tandoors and strict Jain options (no onion, no garlic, no root vegetables) upon advance request.
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🎉</div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Celebrations &amp; Birthdays</div>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5 }}>
            Complimentary dessert platter and celebratory royal table setup for marked anniversaries and birthdays.
          </p>
        </div>
      </div>
    </div>
  );
}
