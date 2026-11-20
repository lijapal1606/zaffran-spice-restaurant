import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReservations } from '../context/ReservationContext';
import styles from './ReservationsPage.module.css';

export default function ReservationsPage() {
  const { reservations, tables, updateReservation, deleteReservation } = useReservations();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [editingRes, setEditingRes] = useState(null);

  // Status counts for tabs
  const counts = {
    all: reservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    seated: reservations.filter(r => r.status === 'seated').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  };

  // Filter reservations
  const filteredReservations = reservations.filter(res => {
    // Status filter
    if (selectedStatus !== 'all' && res.status !== selectedStatus) {
      return false;
    }

    // Date filter
    if (filterDate && res.reservation_date !== filterDate) {
      return false;
    }

    // Search query filter (Name, Phone, Email, Table)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = res.customer_name?.toLowerCase().includes(q);
      const matchPhone = res.phone?.toLowerCase().includes(q);
      const matchEmail = res.email?.toLowerCase().includes(q);
      const matchTable = res.table_number?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchTable) {
        return false;
      }
    }

    return true;
  });

  // Action handlers
  const handleStatusChange = async (res, newStatus) => {
    await updateReservation({
      ...res,
      status: newStatus,
    });
  };

  const handleDelete = async (resId) => {
    if (window.confirm(`Are you sure you want to cancel reservation #${resId}? Assigned tables will be freed immediately.`)) {
      await deleteReservation(resId);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRes) return;
    await updateReservation(editingRes);
    setEditingRes(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <span>📋</span>
            <span>Reservations &amp; Guest Management</span>
          </h1>
          <p className={styles.pageDesc}>
            Manage booking timelines, seat guests, reassign tables, and track covers.
          </p>
        </div>
        <Link to="/new-reservation" className="btn-primary">
          + New Reservation
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterCard}>
        <div className={styles.filterControlsRow}>
          {/* Real-time search */}
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by guest name, phone, email, or table (e.g. T-2)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Date Filter */}
          <div className={styles.dateFilterBox}>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className={styles.dateInput}
              title="Filter by reservation date"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className="btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className={styles.statusTabs}>
          {[
            { id: 'all', label: 'All Reservations' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'seated', label: 'Seated' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`${styles.statusTab} ${selectedStatus === tab.id ? styles.statusTabActive : ''}`}
            >
              <span>{tab.label}</span>
              <span className={styles.countPill}>{counts[tab.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🍽️</div>
          <div className={styles.emptyTitle}>No Reservations Found</div>
          <p className={styles.emptySub}>
            No reservations match your current search or date filter.
          </p>
          {(searchTerm || filterDate || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDate('');
                setSelectedStatus('all');
              }}
              className="btn-outline"
              style={{ marginTop: '1rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className={styles.resList}>
          {filteredReservations.map(res => {
            let statusBadge = 'badge-confirmed';
            if (res.status === 'confirmed') statusBadge = 'badge-reserved';
            if (res.status === 'seated') statusBadge = 'badge-seated';
            if (res.status === 'completed') statusBadge = 'badge-completed';
            if (res.status === 'cancelled') statusBadge = 'badge-cancelled';

            return (
              <div key={res.id} className={styles.resCard}>
                {/* Guest & Contact */}
                <div className={styles.guestInfo}>
                  <div className={styles.guestName}>
                    <span>{res.customer_name}</span>
                    <span className={`badge ${statusBadge}`}>
                      <span className="badge-dot" />
                      {res.status}
                    </span>
                  </div>
                  <div className={styles.guestContacts}>
                    <span>📞 +91 {res.phone}</span>
                    <span>✉️ {res.email}</span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className={styles.timeInfo}>
                  <div className={styles.dateTime}>
                    {res.reservation_date} • {res.reservation_time?.slice(0, 5)}
                  </div>
                  <div className={styles.partySize}>
                    👥 Party of <strong>{res.party_size}</strong> {res.party_size === 1 ? 'Guest' : 'Guests'}
                  </div>
                </div>

                {/* Table & Zone */}
                <div className={styles.tableInfo}>
                  <div className={styles.tableTag}>
                    {res.table_number ? `Table ${res.table_number}` : 'Unassigned'}
                  </div>
                  <div className={styles.zoneTag}>
                    {res.table_zone || 'Floor Assignment Pending'}
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  {res.special_requests ? (
                    <div className={styles.requestsInfo} title={res.special_requests}>
                      ✨ {res.special_requests}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Standard Dining</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className={styles.actionsGroup}>
                  {res.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(res, 'seated')}
                      className={`${styles.actionButton} ${styles.seatButton}`}
                      title="Mark guest as arrived and seated at table"
                    >
                      Seat Guest
                    </button>
                  )}

                  {res.status === 'seated' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(res, 'completed')}
                      className={`${styles.actionButton} ${styles.completeButton}`}
                      title="Service finished, free table"
                    >
                      Complete &amp; Free
                    </button>
                  )}

                  {res.status !== 'completed' && res.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(res, 'cancelled')}
                      className={`${styles.actionButton} ${styles.cancelButton}`}
                      title="Cancel booking"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setEditingRes({ ...res })}
                    className={styles.actionButton}
                    title="Edit booking details"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(res.id)}
                    className={`${styles.actionButton} ${styles.cancelButton}`}
                    title="Delete permanently"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingRes && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setEditingRes(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700 }}>
                Edit Reservation #{editingRes.id}
              </h2>
              <button
                onClick={() => setEditingRes(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Guest Name
                </label>
                <input
                  type="text"
                  value={editingRes.customer_name}
                  onChange={e => setEditingRes({ ...editingRes, customer_name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editingRes.phone}
                    onChange={e => setEditingRes({ ...editingRes, phone: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Party Size
                  </label>
                  <select
                    value={editingRes.party_size}
                    onChange={e => setEditingRes({ ...editingRes, party_size: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(num => (
                      <option key={num} value={num}>
                        {num} Guests
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={editingRes.reservation_date}
                    onChange={e => setEditingRes({ ...editingRes, reservation_date: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={editingRes.reservation_time?.slice(0, 5)}
                    onChange={e => setEditingRes({ ...editingRes, reservation_time: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Assigned Table
                </label>
                <select
                  value={editingRes.table_id || ''}
                  onChange={e => {
                    const tid = e.target.value ? Number(e.target.value) : null;
                    const tbl = tables.find(t => t.id === tid);
                    setEditingRes({
                      ...editingRes,
                      table_id: tid,
                      table_number: tbl ? tbl.table_number : '',
                      table_zone: tbl ? tbl.zone : '',
                    });
                  }}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                >
                  <option value="">No Table Assigned</option>
                  {tables.map(tbl => (
                    <option key={tbl.id} value={tbl.id}>
                      {tbl.table_number} ({tbl.zone}) • Cap {tbl.capacity} ({tbl.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Reservation Status
                </label>
                <select
                  value={editingRes.status}
                  onChange={e => setEditingRes({ ...editingRes, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="seated">Seated</option>
                  <option value="completed">Completed (Frees Table)</option>
                  <option value="cancelled">Cancelled (Frees Table)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Special Requests
                </label>
                <textarea
                  rows="2"
                  value={editingRes.special_requests || ''}
                  onChange={e => setEditingRes({ ...editingRes, special_requests: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRes(null)}
                  className="btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
