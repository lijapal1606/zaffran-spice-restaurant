import React, { useState } from 'react';
import { useReservations } from '../context/ReservationContext';
import styles from './ReservationForm.module.css';

const LUNCH_SLOTS = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'];
const DINNER_SLOTS = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];

const POPULAR_REQUESTS = [
  'Window Seat',
  'Strict Jain (No Root Veg)',
  'Anniversary Decor',
  'Birthday Celebration',
  'High Chair for Child',
  'Courtyard Patio',
  'Royal Majlis Lounge',
  'Low Spice / Mild',
];

export default function ReservationForm({ onFinished, compact = false }) {
  const { tables, createReservation, loading } = useReservations();

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    reservation_date: todayStr,
    reservation_time: '19:30',
    party_size: 2,
    table_id: '',
    special_requests: '',
  });

  const [errors, setErrors] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form fields
  const validate = () => {
    const errs = {};
    if (!formData.customer_name.trim() || formData.customer_name.trim().length < 2) {
      errs.customer_name = 'Customer name must be at least 2 characters.';
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Valid 10-digit Indian phone number is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }

    if (!formData.reservation_date) {
      errs.reservation_date = 'Please select a reservation date.';
    } else if (formData.reservation_date < todayStr) {
      errs.reservation_date = 'Cannot book a past date.';
    }

    if (!formData.reservation_time) {
      errs.reservation_time = 'Please select a time slot.';
    }

    if (!formData.party_size || formData.party_size < 1) {
      errs.party_size = 'Party size must be at least 1 guest.';
    } else if (formData.party_size > 16) {
      errs.party_size = 'For large gatherings above 16, please contact our Royal Banquet Concierge.';
    }

    // If specific table selected, verify capacity
    if (formData.table_id) {
      const selectedTbl = tables.find(t => t.id === Number(formData.table_id));
      if (selectedTbl && selectedTbl.capacity < Number(formData.party_size)) {
        errs.table_id = `Table ${selectedTbl.table_number} holds up to ${selectedTbl.capacity} guests (selected party: ${formData.party_size}).`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Toggle quick dietary/request tag
  const toggleTag = (tag) => {
    let updatedTags;
    if (selectedTags.includes(tag)) {
      updatedTags = selectedTags.filter(t => t !== tag);
    } else {
      updatedTags = [...selectedTags, tag];
    }
    setSelectedTags(updatedTags);

    // Sync tags into special_requests textarea
    const baseCustom = formData.special_requests
      .split(',')
      .map(s => s.trim())
      .filter(s => !POPULAR_REQUESTS.includes(s) && s.length > 0)
      .join(', ');

    const combined = [...updatedTags, ...(baseCustom ? [baseCustom] : [])].join(', ');
    setFormData(prev => ({ ...prev, special_requests: combined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await createReservation({
      customer_name: formData.customer_name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      reservation_date: formData.reservation_date,
      reservation_time: formData.reservation_time,
      party_size: Number(formData.party_size),
      special_requests: formData.special_requests.trim(),
      table_id: formData.table_id ? Number(formData.table_id) : null,
      status: 'confirmed',
    });
    setIsSubmitting(false);

    if (result && result.success) {
      // Reset form on success
      setFormData({
        customer_name: '',
        phone: '',
        email: '',
        reservation_date: todayStr,
        reservation_time: '19:30',
        party_size: 2,
        table_id: '',
        special_requests: '',
      });
      setSelectedTags([]);
      if (onFinished) onFinished();
    }
  };

  return (
    <div className={styles.formCard}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span>🍛</span>
          <span>{compact ? 'Quick Reservation' : 'Book a Royal Dining Experience'}</span>
        </h2>
        <p className={styles.subtitle}>
          Reserve a dining table across our Main Dining Hall, Courtyard Veranda, or Royal Majlis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* Customer Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            <span>Guest Name <span className={styles.required}>*</span></span>
          </label>
          <input
            type="text"
            name="customer_name"
            placeholder="e.g. Aarav Sharma"
            value={formData.customer_name}
            onChange={handleChange}
            className={`${styles.input} ${errors.customer_name ? styles.inputError : ''}`}
          />
          {errors.customer_name && <span className={styles.errorText}>{errors.customer_name}</span>}
        </div>

        {/* Contact Info (Phone & Email) */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <span>Phone <span className={styles.required}>*</span></span>
            </label>
            <div className={styles.phoneInputWrapper}>
              <span className={styles.phonePrefix}>+91</span>
              <input
                type="tel"
                name="phone"
                maxLength="12"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                className={`${styles.input} ${styles.phoneInput} ${errors.phone ? styles.inputError : ''}`}
              />
            </div>
            {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <span>Email <span className={styles.required}>*</span></span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="aarav@example.com"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>
        </div>

        {/* Date, Time Slot & Party Size */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <span>Date <span className={styles.required}>*</span></span>
            </label>
            <input
              type="date"
              name="reservation_date"
              min={todayStr}
              value={formData.reservation_date}
              onChange={handleChange}
              className={`${styles.input} ${errors.reservation_date ? styles.inputError : ''}`}
            />
            {errors.reservation_date && <span className={styles.errorText}>{errors.reservation_date}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <span>Party Size <span className={styles.required}>*</span></span>
            </label>
            <select
              name="party_size"
              value={formData.party_size}
              onChange={handleChange}
              className={`${styles.select} ${errors.party_size ? styles.inputError : ''}`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
            {errors.party_size && <span className={styles.errorText}>{errors.party_size}</span>}
          </div>
        </div>

        {/* Time Slot Picker */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            <span>Time Slot <span className={styles.required}>*</span></span>
          </label>
          <select
            name="reservation_time"
            value={formData.reservation_time}
            onChange={handleChange}
            className={`${styles.select} ${errors.reservation_time ? styles.inputError : ''}`}
          >
            <optgroup label="☀️ Lunch Service (12:00 PM - 3:00 PM)">
              {LUNCH_SLOTS.map(t => (
                <option key={t} value={t}>
                  {t} PM - Lunch
                </option>
              ))}
            </optgroup>
            <optgroup label="🌙 Dinner Service (7:00 PM - 10:30 PM)">
              {DINNER_SLOTS.map(t => (
                <option key={t} value={t}>
                  {t} PM - Dinner
                </option>
              ))}
            </optgroup>
          </select>
          {errors.reservation_time && <span className={styles.errorText}>{errors.reservation_time}</span>}
        </div>

        {/* Table Selection Dropdown */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            <span>Table Preference</span>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 'normal' }}>
              Optional (Auto-assigns best fit)
            </span>
          </label>
          <select
            name="table_id"
            value={formData.table_id}
            onChange={handleChange}
            className={`${styles.select} ${errors.table_id ? styles.inputError : ''}`}
          >
            <option value="">⚡ Auto-Assign Best Available Table</option>
            {tables.map(tbl => {
              const isOccupied = tbl.status === 'occupied';
              const isSmall = tbl.capacity < Number(formData.party_size);
              const isReserved = tbl.status === 'reserved';
              const disabled = isOccupied || isSmall;

              let label = `${tbl.table_number} (${tbl.zone}) • Cap ${tbl.capacity} — ${tbl.status.toUpperCase()}`;
              if (isSmall) label += ` (Too small for ${formData.party_size})`;
              else if (isOccupied) label += ` (Currently Dining)`;
              else if (isReserved) label += ` (Has Active Booking)`;

              return (
                <option key={tbl.id} value={tbl.id} disabled={disabled}>
                  {label}
                </option>
              );
            })}
          </select>
          {errors.table_id && <span className={styles.errorText}>{errors.table_id}</span>}
          <span className={styles.tableStatusHint}>
            System guarantees the closest table capacity match to prevent empty seat wastage.
          </span>
        </div>

        {/* Dietary / Special Requests */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            <span>Special Requests &amp; Dietary Notes</span>
          </label>

          {/* Quick Clickable Tags */}
          <div className={styles.quickTagsContainer}>
            {POPULAR_REQUESTS.map(tag => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`${styles.quickTag} ${isSelected ? styles.quickTagActive : ''}`}
                >
                  {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                </button>
              );
            })}
          </div>

          <textarea
            name="special_requests"
            rows="2"
            placeholder="e.g. Jain preparation, anniversary flowers, preferred seating..."
            value={formData.special_requests}
            onChange={handleChange}
            className={styles.textarea}
            style={{ marginTop: '0.5rem' }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className={`btn-primary ${styles.submitBtn}`}
        >
          {isSubmitting ? 'Confirming Reservation...' : 'Confirm Table Reservation'}
        </button>
      </form>
    </div>
  );
}
