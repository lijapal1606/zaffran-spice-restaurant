import React, { useState } from 'react';
import { useReservations } from '../context/ReservationContext';
import styles from './TableFloorPlan.module.css';

export default function TableFloorPlan({ filterZone = 'all' }) {
  const { tables, updateTableStatus } = useReservations();
  const [selectedZone, setSelectedZone] = useState(filterZone);
  const [activeModalTable, setActiveModalTable] = useState(null);

  const zones = ['all', 'Main Dining', 'Courtyard', 'Royal Majlis'];

  const filteredTables = selectedZone === 'all'
    ? tables
    : tables.filter(t => t.zone.toLowerCase() === selectedZone.toLowerCase());

  // Group tables by zone
  const tablesByZone = {
    'Main Dining': filteredTables.filter(t => t.zone === 'Main Dining'),
    'Courtyard': filteredTables.filter(t => t.zone === 'Courtyard'),
    'Royal Majlis': filteredTables.filter(t => t.zone === 'Royal Majlis'),
  };

  const handleStatusChange = async (tableId, newStatus) => {
    await updateTableStatus(tableId, newStatus);
    setActiveModalTable(null);
  };

  // Helper to render chairs based on capacity
  const renderChairs = (capacity, statusClass) => {
    const topCount = Math.ceil(capacity / 2);
    const bottomCount = Math.floor(capacity / 2);

    return (
      <div className={`${styles.visualContainer} ${statusClass}`}>
        <div className={styles.chairsRow}>
          {Array.from({ length: topCount }).map((_, i) => (
            <span key={`top-${i}`} className={styles.chairIcon} />
          ))}
        </div>
        <div className={styles.tableSurface}>
          <span>{capacity} Seats</span>
        </div>
        <div className={styles.chairsRow}>
          {Array.from({ length: bottomCount }).map((_, i) => (
            <span key={`bot-${i}`} className={styles.chairIcon} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.floorPlanContainer}>
      {/* Header & Legend */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>
            <span>🗺️</span>
            <span>Interactive Floor Layout &amp; Live Tables</span>
          </h2>
          <span className={styles.subtitle}>
            Real-time table occupancy, guest assignments, and status overrides.
          </span>
        </div>

        {/* Legend */}
        <div className={styles.legendBar}>
          <div className={styles.legendItem}>
            <span className="badge badge-available">
              <span className="badge-dot" /> Available
            </span>
          </div>
          <div className={styles.legendItem}>
            <span className="badge badge-occupied">
              <span className="badge-dot" /> Occupied
            </span>
          </div>
          <div className={styles.legendItem}>
            <span className="badge badge-reserved">
              <span className="badge-dot" /> Reserved
            </span>
          </div>
        </div>
      </div>

      {/* Zone Filter Tabs */}
      <div className={styles.zoneFilterTabs}>
        {zones.map(z => (
          <button
            key={z}
            onClick={() => setSelectedZone(z)}
            className={`${styles.tabBtn} ${selectedZone === z ? styles.tabBtnActive : ''}`}
          >
            {z === 'all' ? 'All Dining Zones (10 Tables)' : z}
          </button>
        ))}
      </div>

      {/* Zones List */}
      <div className={styles.zonesContainer}>
        {Object.entries(tablesByZone).map(([zoneName, zoneTables]) => {
          if (zoneTables.length === 0) return null;

          let zoneIcon = '🏛️';
          let zoneDesc = 'Grand banquet ambiance with central chandeliers';
          if (zoneName === 'Courtyard') {
            zoneIcon = '🌿';
            zoneDesc = 'Open-air veranda surrounded by jasmine & marble fountains';
          } else if (zoneName === 'Royal Majlis') {
            zoneIcon = '👑';
            zoneDesc = 'Private luxury alcoves with silk bolsters & brass jaali partitions';
          }

          return (
            <div key={zoneName} className={styles.zoneSection}>
              <div className={styles.zoneHeader}>
                <div className={styles.zoneTitle}>
                  <span>{zoneIcon}</span>
                  <span>{zoneName}</span>
                </div>
                <span className={styles.zoneSubtitle}>{zoneDesc}</span>
              </div>

              <div className={styles.tablesGrid}>
                {zoneTables.map(tbl => {
                  let statusBadgeClass = 'badge-available';
                  let surfaceTheme = styles.surfaceAvailable;

                  if (tbl.status === 'occupied') {
                    statusBadgeClass = 'badge-occupied';
                    surfaceTheme = styles.surfaceOccupied;
                  } else if (tbl.status === 'reserved') {
                    statusBadgeClass = 'badge-reserved';
                    surfaceTheme = styles.surfaceReserved;
                  }

                  return (
                    <div key={tbl.id} className={styles.tableNode}>
                      <div className={styles.nodeTop}>
                        <div className={styles.tableNumberBadge}>{tbl.table_number}</div>
                        <span className={`badge ${statusBadgeClass}`}>
                          <span className="badge-dot" />
                          {tbl.status}
                        </span>
                      </div>

                      <div className={styles.capacityPill}>Capacity: {tbl.capacity} Covers</div>

                      {/* Visual Table & Chairs */}
                      {renderChairs(tbl.capacity, surfaceTheme)}

                      {/* Guest details if reserved or occupied */}
                      {tbl.current_guest ? (
                        <div className={styles.guestDetails}>
                          <div className={styles.guestName}>
                            <span>👤 {tbl.current_guest}</span>
                            {tbl.current_booking_time && <span>{tbl.current_booking_time.slice(0, 5)}</span>}
                          </div>
                          {tbl.guest_special_requests && (
                            <div className={styles.guestRequests}>
                              "{tbl.guest_special_requests}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={styles.guestDetails} style={{ color: '#94A3B8', textAlign: 'center' }}>
                          Ready for seating
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className={styles.actionsRow}>
                        <button
                          type="button"
                          onClick={() => setActiveModalTable(tbl)}
                          className={styles.actionBtn}
                        >
                          Change Status
                        </button>

                        {tbl.status === 'reserved' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(tbl.id, 'occupied')}
                            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                          >
                            Seat Now
                          </button>
                        )}

                        {tbl.status === 'occupied' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(tbl.id, 'available')}
                            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                          >
                            Free Table
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Status Override */}
      {activeModalTable && (
        <div className={styles.modalBackdrop} onClick={() => setActiveModalTable(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Update Status for Table {activeModalTable.table_number}
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Zone: {activeModalTable.zone} • Capacity: {activeModalTable.capacity} Guests
            </p>

            <div className={styles.statusOptionList}>
              <div
                className={`${styles.statusOption} ${activeModalTable.status === 'available' ? styles.statusOptionActive : ''}`}
                onClick={() => handleStatusChange(activeModalTable.id, 'available')}
              >
                <div>
                  <strong>Available</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Table is vacant and clean for new guests</div>
                </div>
                <span className="badge badge-available"><span className="badge-dot" /> Free</span>
              </div>

              <div
                className={`${styles.statusOption} ${activeModalTable.status === 'occupied' ? styles.statusOptionActive : ''}`}
                onClick={() => handleStatusChange(activeModalTable.id, 'occupied')}
              >
                <div>
                  <strong>Occupied</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Guests are currently seated and dining</div>
                </div>
                <span className="badge badge-occupied"><span className="badge-dot" /> Seated</span>
              </div>

              <div
                className={`${styles.statusOption} ${activeModalTable.status === 'reserved' ? styles.statusOptionActive : ''}`}
                onClick={() => handleStatusChange(activeModalTable.id, 'reserved')}
              >
                <div>
                  <strong>Reserved</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Held for an upcoming reservation</div>
                </div>
                <span className="badge badge-reserved"><span className="badge-dot" /> Booked</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModalTable(null)}
              className="btn-outline"
              style={{ marginTop: '0.5rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
